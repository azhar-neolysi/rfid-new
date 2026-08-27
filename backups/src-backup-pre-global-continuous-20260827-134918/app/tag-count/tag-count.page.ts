import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { App } from '@capacitor/app';
import { Subscription } from 'rxjs';
import * as XLSX from 'xlsx';
import { ProductService } from '../itemmaster/product.service';
import { HardwareRfidService } from '../services/hardware-rfid.service';

interface CountedTag {
  epc: string;
  firstSeen: number;
  lastSeen: number;
  bestRssi?: number;
  lastRssi?: number;
  channelIndex?: number;
  reads: number;
  product?: any;
}

// Approximate IN-region (865-867 MHz) channel plan: ch0 = 865.0 MHz, 200 kHz steps.
const REGION_START_MHZ = 865.0;
const REGION_STEP_MHZ = 0.2;
const REGION_MAX_MHZ = 867.0;

interface MissingRow {
  epc: string;
  product: any;
}

@Component({
  selector: 'app-tag-count',
  templateUrl: './tag-count.page.html',
  styleUrls: ['./tag-count.page.scss'],
})
export class TagCountPage implements OnInit, OnDestroy {
  readerConnected = false;
  pageActive = false;
  counting = false;
  loadingProducts = false;

  segment: 'found' | 'missing' | 'unknown' = 'found';

  countedRows: CountedTag[] = [];
  foundRows: CountedTag[] = [];
  unknownRows: CountedTag[] = [];
  missingRows: MissingRow[] = [];

  totalReads = 0;
  readsPerMin = 0;
  sessionStart = 0;
  sortFoundBySignal = false;
  selectedEpcs = new Set<string>();

  private countedMap = new Map<string, CountedTag>();
  private missingIndex = new Map<string, number>();
  private productByEpc = new Map<string, any>();
  private foundDirty = false;
  private sortedFoundCache: CountedTag[] = [];
  private rateTimer: any = null;
  private subs: Subscription[] = [];
  private appStateHandle: import('@capacitor/core').PluginListenerHandle | null = null;

  constructor(
    private product: ProductService,
    private hardwareRfid: HardwareRfidService,
    private router: Router
  ) {}

  /** Open the Tag Locator page pre-filled with this EPC. */
  locateTag(epc: string) {
    if (!epc) return;
    this.router.navigate(['/tag-locator'], { queryParams: { epc } });
  }

  toggleSelect(epc: string) {
    if (this.selectedEpcs.has(epc)) {
      this.selectedEpcs.delete(epc);
    } else {
      this.selectedEpcs.add(epc);
    }
  }

  isSelected(epc: string): boolean {
    return this.selectedEpcs.has(epc);
  }

  selectAll() {
    const rows = this.currentRows;
    for (const row of rows) {
      this.selectedEpcs.add(row.epc);
    }
  }

  clearSelection() {
    this.selectedEpcs.clear();
  }

  get selectedCount(): number {
    return this.selectedEpcs.size;
  }

  get currentRows(): CountedTag[] | MissingRow[] {
    if (this.segment === 'found') return this.displayFoundRows;
    if (this.segment === 'missing') return this.missingRows;
    return this.unknownRows;
  }

  locateSelected() {
    if (this.selectedEpcs.size === 0) return;
    const csv = [...this.selectedEpcs].join(',');
    this.router.navigate(['/tag-locator'], { queryParams: { epc: csv } });
  }

  ngOnInit() {
    this.readerConnected = this.hardwareRfid.isConnected;
    this.subs.push(
      this.hardwareRfid.connected$.subscribe(() => {
        this.readerConnected = true;
      }),
      this.hardwareRfid.disconnected$.subscribe(() => {
        this.readerConnected = false;
      }),
      this.hardwareRfid.tagRead$.subscribe((event) => {
        if (!this.pageActive || !this.counting) return;
        this.onTagRead(event.epc, event.rssi, event.channelIndex);
      })
    );
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive && this.pageActive) {
        // Screen back on / app reopened: resume counting automatically.
        this.ensureCountingAlive();
      }
    }).then((handle) => {
      this.appStateHandle = handle;
    });
    this.loadProducts();
  }

  ngOnDestroy() {
    this.stopRateTimer();
    this.subs.forEach((s) => s.unsubscribe());
    if (this.appStateHandle) {
      this.appStateHandle.remove().catch(() => {});
      this.appStateHandle = null;
    }
  }

  ionViewDidEnter() {
    this.pageActive = true;
    this.autoStartCounting();
  }

  ionViewDidLeave() {
    this.pageActive = false;
    if (this.counting) {
      this.stopCount();
    }
  }

  loadProducts() {
    this.loadingProducts = true;
    this.product.getProducts().subscribe(
      (res: any) => {
        const products = Array.isArray(res) ? res : [];
        this.productByEpc.clear();
        this.missingRows = [];
        this.missingIndex.clear();
        products.forEach((p: any) => {
          const epc = p.rfidcode;
          if (!epc || this.productByEpc.has(epc)) return;
          this.productByEpc.set(epc, p);
          if (!this.countedMap.has(epc)) {
            this.missingIndex.set(epc, this.missingRows.length);
            this.missingRows.push({ epc, product: p });
          }
        });
        this.loadingProducts = false;
      },
      () => {
        this.loadingProducts = false;
      }
    );
  }

  private onTagRead(epc: string, rssi?: number, channelIndex?: number) {
    if (!epc) return;
    const now = Date.now();
    this.totalReads++;
    const existing = this.countedMap.get(epc);
    if (existing) {
      existing.reads++;
      existing.lastSeen = now;
      if (rssi != null) {
        existing.lastRssi = rssi;
        if (existing.bestRssi == null || rssi > existing.bestRssi) {
          existing.bestRssi = rssi;
        }
        this.foundDirty = true;
      }
      if (channelIndex != null) {
        existing.channelIndex = channelIndex;
      }
      return;
    }

    const product = this.productByEpc.get(epc);
    const entry: CountedTag = {
      epc,
      firstSeen: now,
      lastSeen: now,
      bestRssi: rssi,
      lastRssi: rssi,
      channelIndex,
      reads: 1,
      product,
    };
    this.countedMap.set(epc, entry);
    this.countedRows.push(entry);

    if (product) {
      this.foundRows.push(entry);
      this.foundDirty = true;
      const idx = this.missingIndex.get(epc);
      if (idx != null) {
        const lastIdx = this.missingRows.length - 1;
        const movedRow = this.missingRows[lastIdx];
        this.missingRows[idx] = movedRow;
        this.missingRows.pop();
        if (lastIdx !== idx) {
          this.missingIndex.set(movedRow.epc, idx);
        }
        this.missingIndex.delete(epc);
      }
    } else {
      this.unknownRows.push(entry);
    }
  }

  async startCount() {
    if (this.counting) return;
    try {
      await this.hardwareRfid.ensureConnected();
      await this.hardwareRfid.forceStopInventory();
      await this.hardwareRfid.forceStartInventoryContinuous();
      this.sessionStart = Date.now();
      this.counting = true;
      this.startRateTimer();
    } catch (err) {
      console.error('[TagCount] start failed:', err);
      this.counting = false;
      this.stopRateTimer();
    }
  }

  /** Auto-scan: start counting as soon as the page opens. */
  private autoStartCounting() {
    if (this.counting) {
      this.ensureCountingAlive();
      return;
    }
    this.startCount();
  }

  /**
   * Self-heal a running session after screen-off/app switch: the service
   * stops inventory in background, so restart it when we come back.
   */
  private async ensureCountingAlive() {
    if (!this.counting || this.hardwareRfid.isInventoryRunning) return;
    try {
      await this.hardwareRfid.ensureConnected();
      await this.hardwareRfid.forceStopInventory();
      await this.hardwareRfid.forceStartInventoryContinuous();
    } catch (err) {
      console.error('[TagCount] resume counting failed:', err);
    }
  }

  stopCount() {
    this.hardwareRfid.stopInventory().catch(() => {});
    this.counting = false;
    this.stopRateTimer();
  }

  newSession() {
    if (this.counting) this.stopCount();
    this.countedMap.clear();
    this.missingIndex.clear();
    this.countedRows = [];
    this.foundRows = [];
    this.unknownRows = [];
    this.sortedFoundCache = [];
    this.foundDirty = false;
    this.totalReads = 0;
    this.readsPerMin = 0;
    this.sessionStart = 0;
    this.selectedEpcs.clear();
    this.loadProducts();
  }

  exportExcel() {
    if (!this.countedRows.length) return;
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const counted = this.countedRows.map((r) => ({
      EPC: r.epc,
      ProductName: r.product?.productName ?? '',
      PrintName: r.product?.printName ?? '',
      ItemCode: r.product?.itemCode ?? '',
      BarCode: r.product?.barCode ?? '',
      Brand: r.product?.brand ?? '',
      Category: r.product?.category ?? '',
      FirstSeen: new Date(r.firstSeen).toLocaleString(),
      LastSeen: new Date(r.lastSeen).toLocaleString(),
      Reads: r.reads,
      BestRSSI: r.bestRssi != null ? r.bestRssi : '',
      LiveRSSI: r.lastRssi != null ? r.lastRssi : '',
      EstDistanceM: this.estimateDistance(r.lastRssi) ?? '',
      Channel: r.channelIndex != null ? r.channelIndex : '',
      FreqMHz: this.channelMhz(r.channelIndex) ?? '',
    }));
    const missing = this.missingRows.map((m) => ({
      EPC: m.epc,
      ProductName: m.product?.productName ?? '',
      PrintName: m.product?.printName ?? '',
      ItemCode: m.product?.itemCode ?? '',
      BarCode: m.product?.barCode ?? '',
      Brand: m.product?.brand ?? '',
      Category: m.product?.category ?? '',
    }));
    const unknown = this.unknownRows.map((r) => ({
      EPC: r.epc,
      FirstSeen: new Date(r.firstSeen).toLocaleString(),
      Reads: r.reads,
      BestRSSI: r.bestRssi != null ? r.bestRssi : '',
      LiveRSSI: r.lastRssi != null ? r.lastRssi : '',
      EstDistanceM: this.estimateDistance(r.lastRssi) ?? '',
      Channel: r.channelIndex != null ? r.channelIndex : '',
      FreqMHz: this.channelMhz(r.channelIndex) ?? '',
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(counted), 'Counted');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(missing), 'Missing');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(unknown), 'Unknown');
    XLSX.writeFile(wb, `tag-count-${stamp}.xlsx`);
  }

  signalLevel(rssi?: number): number {
    if (rssi == null) return 0;
    if (rssi >= -50) return 4;
    if (rssi >= -65) return 3;
    if (rssi >= -80) return 2;
    return 1;
  }

  get displayFoundRows(): CountedTag[] {
    if (!this.sortFoundBySignal) return this.foundRows;
    if (this.foundDirty || this.sortedFoundCache.length !== this.foundRows.length) {
      this.sortedFoundCache = [...this.foundRows].sort(
        (a, b) => (b.lastRssi ?? -999) - (a.lastRssi ?? -999)
      );
      this.foundDirty = false;
    }
    return this.sortedFoundCache;
  }

  estimateDistance(rssi?: number): number | null {
    if (rssi == null) return null;
    const meters = Math.pow(10, (-rssi - 30) / 20);
    return Math.min(99, Math.round(meters * 10) / 10);
  }

  channelMhz(channelIndex?: number): number | null {
    if (channelIndex == null || channelIndex < 0) return null;
    const mhz = REGION_START_MHZ + channelIndex * REGION_STEP_MHZ;
    return Math.min(REGION_MAX_MHZ, Math.round(mhz * 10) / 10);
  }

  trackByEpc(index: number, item: any) {
    return item ? item.epc : index;
  }

  private startRateTimer() {
    this.stopRateTimer();
    this.rateTimer = setInterval(() => {
      const elapsedMin = (Date.now() - this.sessionStart) / 60000;
      this.readsPerMin = elapsedMin > 0 ? Math.round(this.totalReads / elapsedMin) : 0;
    }, 1000);
  }

  private stopRateTimer() {
    if (this.rateTimer) {
      clearInterval(this.rateTimer);
      this.rateTimer = null;
    }
  }
}
