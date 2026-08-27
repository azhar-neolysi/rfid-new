import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Haptics } from '@capacitor/haptics';
import { Subscription } from 'rxjs';
import { HardwareRfidService } from '../services/hardware-rfid.service';

const RING_CIRCUMFERENCE = 2 * Math.PI * 84;
// Approximate IN-region (865-867 MHz) channel plan: ch0 = 865.0 MHz, 200 kHz steps.
const REGION_START_MHZ = 865.0;
const REGION_STEP_MHZ = 0.2;

@Component({
  selector: 'app-tag-locator',
  templateUrl: './tag-locator.page.html',
  styleUrls: ['./tag-locator.page.scss'],
})
export class TagLocatorPage implements OnDestroy {
  readerConnected = false;
  locateMode = false;
  locating = false;
  targetEpc = '';
  proximity = 0;
  targetRssi: number | undefined;
  bestRssi: number | undefined;
  lastChannelIndex: number | undefined;
  lastAntennaId: number | undefined;
  targetReads = 0;
  lastSeenAgo: number | null = null;

  history: number[] = [];
  private readTimes: number[] = [];
  private lastSeenAt = 0;
  private nowTick = Date.now();
  private tickTimer: any = null;
  private lastVibrateAt = 0;
  private pageActive = false;
  private pendingEpc: string | null = null;
  private subs: Subscription[] = [];

  constructor(
    private hardwareRfid: HardwareRfidService,
    private route: ActivatedRoute
  ) {}

  ionViewDidEnter() {
    this.pageActive = true;
    this.readerConnected = this.hardwareRfid.isConnected;
    if (this.subs.length === 0) {
      this.subs.push(
        this.hardwareRfid.connected$.subscribe(() => {
          this.readerConnected = true;
        }),
        this.hardwareRfid.disconnected$.subscribe(() => {
          this.readerConnected = false;
        }),
        this.hardwareRfid.tagRead$.subscribe((event) => {
          if (!this.pageActive || !this.locating || !event.epc) return;
          this.onLocateRead(event.epc.toUpperCase(), event.rssi, event.channelIndex, event.antennaId);
        })
      );
      this.route.queryParams.subscribe((params) => {
        const epc = params ? params['epc'] : null;
        this.pendingEpc = epc ? String(epc).trim().toUpperCase() : null;
      });
    }
    // Arriving from the Find Tag list: pre-fill and start immediately.
    if (this.pendingEpc && !this.locating) {
      this.targetEpc = this.pendingEpc;
      this.pendingEpc = null;
      this.startLocator();
    }
    if (this.tickTimer == null) {
      this.tickTimer = setInterval(() => {
        this.nowTick = Date.now();
        this.lastSeenAgo =
          this.locateMode && this.lastSeenAt > 0
            ? Math.max(0, Math.round((this.nowTick - this.lastSeenAt) / 1000))
            : null;
      }, 1000);
    }
  }

  ionViewDidLeave() {
    this.pageActive = false;
    if (this.tickTimer != null) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
    if (this.locating) {
      this.stopLocator();
    }
  }

  ngOnDestroy() {
    this.subs.forEach((s) => s.unsubscribe());
    this.subs = [];
    if (this.tickTimer != null) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
    if (this.locating) {
      this.stopLocator();
    }
  }

  async startLocator() {
    const target = this.targetEpc.trim().toUpperCase();
    if (!target) return;
    try {
      await this.hardwareRfid.ensureConnected();
      await this.hardwareRfid.forceStopInventory();
      await this.hardwareRfid.forceStartInventoryContinuous();
      this.targetEpc = target;
      this.locateMode = true;
      this.locating = true;
      this.proximity = 0;
      this.targetRssi = undefined;
      this.bestRssi = undefined;
      this.lastChannelIndex = undefined;
      this.lastAntennaId = undefined;
      this.targetReads = 0;
      this.lastSeenAgo = null;
      this.history = [];
      this.readTimes = [];
      this.lastSeenAt = 0;
    } catch (err) {
      console.error('[TagLocator] locator start failed:', err);
    }
  }

  stopLocator() {
    this.locateMode = false;
    this.locating = false;
    this.proximity = 0;
    this.hardwareRfid.forceStopInventory().catch(() => {});
  }

  get ringOffset(): number {
    return RING_CIRCUMFERENCE * (1 - this.proximity / 100);
  }

  signalLabel(): string {
    if (!this.locateMode) return '';
    if (this.proximity <= 0) return 'Searching...';
    if (this.proximity >= 75) return 'Very close';
    if (this.proximity >= 40) return 'Near';
    if (this.proximity >= 15) return 'Getting closer';
    return 'Far';
  }

  distanceText(): string {
    const m = this.estimateDistance(this.targetRssi);
    if (m == null) return '--';
    return m < 10 ? m.toFixed(1) : String(Math.round(m));
  }

  estimateDistance(rssi?: number): number | null {
    if (rssi == null) return null;
    const meters = Math.pow(10, (-rssi - 30) / 20);
    return Math.min(99, Math.round(meters * 10) / 10);
  }

  channelMhz(channelIndex?: number): number | null {
    if (channelIndex == null || channelIndex < 0) return null;
    const mhz = REGION_START_MHZ + channelIndex * REGION_STEP_MHZ;
    return Math.min(867.0, Math.round(mhz * 100) / 100);
  }

  signalLevel(rssi?: number): number {
    if (rssi == null) return 0;
    if (rssi >= -50) return 4;
    if (rssi >= -65) return 3;
    if (rssi >= -80) return 2;
    return 1;
  }

  rateText(): string {
    const cutoff = Date.now() - 5000;
    this.readTimes = this.readTimes.filter((t) => t > cutoff);
    return (this.readTimes.length / 5).toFixed(1);
  }

  histHeight(rssi: number): number {
    const pct = ((rssi + 90) / 60) * 100;
    return Math.max(12, Math.min(100, pct));
  }

  private onLocateRead(epc: string, rssi?: number, channelIndex?: number, antennaId?: number) {
    if (!this.targetEpc || epc !== this.targetEpc || rssi == null) return;
    this.targetRssi = rssi;
    this.lastChannelIndex = channelIndex;
    this.lastAntennaId = antennaId;
    this.targetReads++;
    this.lastSeenAt = Date.now();
    this.lastSeenAgo = 0;
    if (this.bestRssi == null || rssi > this.bestRssi) {
      this.bestRssi = rssi;
    }
    this.history.push(rssi);
    if (this.history.length > 24) {
      this.history.shift();
    }
    this.readTimes.push(Date.now());
    const pct = Math.max(0, Math.min(100, ((rssi + 90) / 60) * 100));
    this.proximity = Math.round(pct);
    this.maybeVibrate(this.proximity);
  }

  private maybeVibrate(proximity: number) {
    const now = Date.now();
    const throttle = proximity >= 75 ? 200 : proximity >= 40 ? 500 : 900;
    if (now - this.lastVibrateAt < throttle) return;
    this.lastVibrateAt = now;
    Haptics.vibrate({ duration: proximity >= 75 ? 300 : 120 }).catch(() => {});
  }
}
