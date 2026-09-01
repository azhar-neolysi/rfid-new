import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Haptics } from '@capacitor/haptics';
import { Subscription } from 'rxjs';
import * as XLSX from 'xlsx';
import { HardwareRfidService } from '../services/hardware-rfid.service';
import { ToastrService } from '../services/toastr/toastr.service';

interface DistancePreset {
  label: string;
  shortLabel: string;
  dbm: number;
}

const RING_CIRCUMFERENCE = 2 * Math.PI * 84;
const REGION_START_MHZ = 865.0;
const REGION_STEP_MHZ = 0.2;

// Staleness / out-of-range handling (seconds)
const STALE_AFTER_S = 2;      // begin fading the % after this long without a read
const OUT_OF_RANGE_AFTER_S = 5; // show "Out of range"/0% after this long without a read

export interface LocateTarget {
  epc: string;
  proximity: number;
  outOfRange: boolean;
  targetRssi: number | undefined;
  bestRssi: number | undefined;
  lastChannelIndex: number | undefined;
  lastAntennaId: number | undefined;
  targetReads: number;
  lastSeenAt: number;
  lastSeenAgo: number | null;
  history: number[];
  readTimes: number[];
  lastVibrateAt: number;
}

@Component({
  selector: 'app-tag-locator',
  templateUrl: './tag-locator.page.html',
  styleUrls: ['./tag-locator.page.scss'],
})
export class TagLocatorPage implements OnDestroy {
  readerConnected = false;
  locateMode = false;
  locating = false;
  targets: LocateTarget[] = [];
  newEpc = '';

  scanMode: 'single' | 'multi' = 'multi';
  maxTags = 25;
  scanPower = 30;
  distancePresets: DistancePreset[] = [
    { label: 'Close (1m)', shortLabel: '1m', dbm: 12 },
    { label: 'Medium (2m)', shortLabel: '2m', dbm: 18 },
    { label: 'Far (5m)', shortLabel: '5m', dbm: 24 },
    { label: 'Max (10m+)', shortLabel: 'Max', dbm: 30 },
  ];
  singleFoundEpc: string | null = null;

  private nowTick = Date.now();
  private tickTimer: any = null;
  private pageActive = false;
  private pendingEpcs: string[] = [];
  private subs: Subscription[] = [];

  constructor(
    private hardwareRfid: HardwareRfidService,
    private route: ActivatedRoute,
    private toastr: ToastrService
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
        const raw = params ? params['epc'] : null;
        if (raw) {
          this.pendingEpcs = String(raw)
            .split(',')
            .map((s: string) => s.trim().toUpperCase())
            .filter((s: string) => s.length > 0);
        }
      });
    }
    if (this.pendingEpcs.length > 0 && !this.locating) {
      for (const epc of this.pendingEpcs) {
        this.addTarget(epc, true);
      }
      this.pendingEpcs = [];
      this.startLocator();
    }
    if (this.tickTimer == null) {
      this.tickTimer = setInterval(() => {
        this.nowTick = Date.now();
        for (const t of this.targets) {
          if (!this.locateMode) continue;
          const ago = t.lastSeenAt > 0 ? (this.nowTick - t.lastSeenAt) / 1000 : Infinity;
          t.lastSeenAgo = t.lastSeenAt > 0 ? Math.max(0, Math.round(ago)) : null;
          if (t.lastSeenAt > 0 && !t.outOfRange && ago > OUT_OF_RANGE_AFTER_S) {
            // Tag stopped being reported: mark out of range and reset the gauge.
            t.outOfRange = true;
            t.proximity = 0;
          } else if (t.lastSeenAt > 0 && ago > STALE_AFTER_S) {
            // No reads for a while: fade the % back toward 0 so it doesn't
            // stick at the last in-range value (e.g. 42%).
            const fade = (ago - STALE_AFTER_S) / (OUT_OF_RANGE_AFTER_S - STALE_AFTER_S);
            t.proximity = Math.max(0, Math.round(t.proximity * (1 - fade)));
          }
        }
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

  addTarget(epcInput?: string, silent = false, skipCap = false) {
    const raw = (epcInput ?? this.newEpc).trim().toUpperCase();
    if (!raw) return;
    if (this.targets.some((t) => t.epc === raw)) {
      if (!silent) this.newEpc = '';
      return;
    }
    if (!skipCap && this.targets.length >= this.maxTags) {
      this.toastr.danger(`Limit reached (${this.maxTags} tags)`);
      return;
    }
    // Single mode only tracks one active target: replace instead of append.
    if (!skipCap && this.scanMode === 'single' && this.targets.length >= 1) {
      this.targets = [];
    }
    this.targets.push({
      epc: raw,
      proximity: 0,
      outOfRange: false,
      targetRssi: undefined,
      bestRssi: undefined,
      lastChannelIndex: undefined,
      lastAntennaId: undefined,
      targetReads: 0,
      lastSeenAt: 0,
      lastSeenAgo: null,
      history: [],
      readTimes: [],
      lastVibrateAt: 0,
    });
    if (!silent) this.newEpc = '';
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsBinaryString(file);
    reader.onload = () => {
      const wb = XLSX.read(reader.result, { type: 'binary' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      if (!sheet) return;
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);
      let imported = 0;
      let rejected = 0;
      for (const row of rows) {
        const epc =
          row.EPC || row.epc || row.TagID || row.tagid ||
          row.RFIDCode || row.rfidcode || row.A;
        if (!epc) continue;
        const val = String(epc).trim();
        if (!val) continue;
        if (this.targets.length + imported >= this.maxTags) {
          rejected++;
          continue;
        }
        this.addTarget(val, true, true);
        imported++;
      }
      if (rejected > 0) {
        this.toastr.warning(`Import limited: added ${imported}, skipped ${rejected} (max ${this.maxTags})`);
      } else if (imported > 0) {
        this.toastr.success(`Imported ${imported} tag(s)`);
      }
      (event.target as HTMLInputElement).value = '';
      this.newEpc = '';
    };
  }

  removeTarget(epc: string) {
    this.targets = this.targets.filter((t) => t.epc !== epc);
    if (this.targets.length === 0 && this.locating) {
      this.stopLocator();
    }
  }

  async startLocator() {
    if (this.targets.length === 0) return;
    this.singleFoundEpc = null;
    try {
      await this.hardwareRfid.ensureConnected();
      await this.hardwareRfid.forceStopInventory();
      await this.hardwareRfid.forceStartInventoryContinuous({ power: this.scanPower });
      for (const t of this.targets) {
        t.proximity = 0;
        t.outOfRange = false;
        t.targetRssi = undefined;
        t.bestRssi = undefined;
        t.lastChannelIndex = undefined;
        t.lastAntennaId = undefined;
        t.targetReads = 0;
        t.lastSeenAt = 0;
        t.lastSeenAgo = null;
        t.history = [];
        t.readTimes = [];
        t.lastVibrateAt = 0;
      }
      this.locateMode = true;
      this.locating = true;
    } catch (err) {
      console.error('[TagLocator] locator start failed:', err);
    }
  }

  stopLocator() {
    this.locateMode = false;
    this.locating = false;
    this.singleFoundEpc = null;
    for (const t of this.targets) {
      t.proximity = 0;
      t.outOfRange = false;
    }
    this.hardwareRfid.forceStopInventory().catch(() => {});
  }

  onScanModeChange() {
    this.singleFoundEpc = null;
    if (this.scanMode === 'single' && this.targets.length > 1) {
      this.targets = [this.targets[0]];
      this.newEpc = '';
    }
  }

  onDistancePresetChange(dbm: number) {
    this.scanPower = dbm;
  }

  isPresetActive(dbm: number): boolean {
    return this.scanPower === dbm;
  }

  get targetLimitReached(): boolean {
    return this.targets.length >= this.maxTags;
  }

  ringOffset(target: LocateTarget): number {
    return RING_CIRCUMFERENCE * (1 - target.proximity / 100);
  }

  signalLabel(target: LocateTarget): string {
    if (!this.locateMode) return '';
    if (target.outOfRange) return 'Out of range';
    if (target.proximity <= 0) return 'Searching...';
    if (target.proximity >= 75) return 'Very close';
    if (target.proximity >= 40) return 'Near';
    if (target.proximity >= 15) return 'Getting closer';
    return 'Far';
  }

  distanceText(target: LocateTarget): string {
    const m = this.estimateDistance(target.targetRssi);
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

  rateText(target: LocateTarget): string {
    const cutoff = Date.now() - 5000;
    target.readTimes = target.readTimes.filter((t) => t > cutoff);
    return (target.readTimes.length / 5).toFixed(1);
  }

  histHeight(rssi: number): number {
    const pct = ((rssi + 90) / 60) * 100;
    return Math.max(12, Math.min(100, pct));
  }

  trackByEpc(index: number, target: LocateTarget): string {
    return target.epc;
  }

  private onLocateRead(epc: string, rssi?: number, channelIndex?: number, antennaId?: number) {
    if (rssi == null) return;
    for (const t of this.targets) {
      if (t.epc !== epc) continue;
      t.targetRssi = rssi;
      t.lastChannelIndex = channelIndex;
      t.lastAntennaId = antennaId;
      t.targetReads++;
      t.lastSeenAt = Date.now();
      t.lastSeenAgo = 0;
      t.outOfRange = false;
      if (t.bestRssi == null || rssi > t.bestRssi) {
        t.bestRssi = rssi;
      }
      t.history.push(rssi);
      if (t.history.length > 24) {
        t.history.shift();
      }
      t.readTimes.push(Date.now());
      const pct = Math.max(0, Math.min(100, ((rssi + 90) / 60) * 100));
      t.proximity = Math.round(pct);
      this.maybeVibrate(t.proximity, t);
      if (this.scanMode === 'single' && this.targets.length === 1 && pct >= 75 && this.locating) {
        this.singleFoundEpc = t.epc;
        this.stopLocator();
        this.toastr.success('Tag located');
      }
    }
  }

  private maybeVibrate(proximity: number, target: LocateTarget) {
    const now = Date.now();
    const throttle = proximity >= 75 ? 200 : proximity >= 40 ? 500 : 900;
    if (now - target.lastVibrateAt < throttle) return;
    target.lastVibrateAt = now;
    Haptics.vibrate({ duration: proximity >= 75 ? 300 : 120 }).catch(() => {});
  }
}
