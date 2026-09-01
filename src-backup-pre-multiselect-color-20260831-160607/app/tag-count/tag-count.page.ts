import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { App } from '@capacitor/app';
import { Subscription } from 'rxjs';
import * as XLSX from 'xlsx';
import { ProductService } from '../itemmaster/product.service';
import { HardwareRfidService } from '../services/hardware-rfid.service';
import { ToastrService } from '../services/toastr/toastr.service';

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

const REGION_START_MHZ = 865.0;
const REGION_STEP_MHZ = 0.2;
const REGION_MAX_MHZ = 867.0;

interface MissingRow {
  epc: string;
  product: any;
}

interface DistancePreset {
  label: string;
  shortLabel: string;
  dbm: number;
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

  scanMode: 'single' | 'multi' = 'multi';
  maxTags = 25;
  singleHighlightEpc: string | null = null;

  scanPower = 30;
  distancePresets: DistancePreset[] = [
    { label: 'Close (1m)', shortLabel: '1m', dbm: 12 },
    { label: 'Medium (2m)', shortLabel: '2m', dbm: 18 },
    { label: 'Far (5m)', shortLabel: '5m', dbm: 24 },
    { label: 'Max (10m+)', shortLabel: 'Max', dbm: 30 },
  ];

  searchTerm = '';

  importedEpcs: string[] = [];
  importedFileName = '';

  private countedMap = new Map<string, CountedTag>();
  private missingIndex = new Map<string, number>();
  private productByEpc = new Map<string, any>();
  private allProducts: any[] = [];
  private foundDirty = false;
  private sortedFoundCache: CountedTag[] = [];
  private rateTimer: any = null;
  private subs: Subscription[] = [];
  private appStateHandle: import('@capacitor/core').PluginListenerHandle | null = null;

  constructor(
    private product: ProductService,
    private hardwareRfid: HardwareRfidService,
    private router: Router,
    private toastr: ToastrService
  ) {}

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
    if (this.segment === 'found') return this.filteredFoundRows;
    if (this.segment === 'missing') return this.filteredMissingRows;
    return this.filteredUnknownRows;
  }

  locateSelected() {
    if (this.selectedEpcs.size === 0) return;
    const csv = [...this.selectedEpcs].join(',');
    this.router.navigate(['/tag-locator'], { queryParams: { epc: csv } });
  }

  // ── Filtered getters (substring search) ──────────────────────────────

  private matchesSearch(epc: string): boolean {
    if (!this.searchTerm) return true;
    return epc.toLowerCase().includes(this.searchTerm.toLowerCase());
  }

  get filteredFoundRows(): CountedTag[] {
    const base = this.displayFoundRows;
    if (!this.searchTerm) return base;
    return base.filter((r) => this.matchesSearch(r.epc));
  }

  get filteredMissingRows(): MissingRow[] {
    if (this.importedEpcs.length > 0) {
      const importedSet = new Set(this.importedEpcs);
      const countedSet = new Set(this.countedMap.keys());
      const rows = this.importedEpcs
        .filter((epc) => !countedSet.has(epc))
        .map((epc) => {
          const product = this.productByEpc.get(epc);
          return { epc, product };
        });
      if (!this.searchTerm) return rows;
      return rows.filter((r) => this.matchesSearch(r.epc));
    }
    if (!this.searchTerm) return this.missingRows;
    return this.missingRows.filter((r) => this.matchesSearch(r.epc));
  }

  get filteredUnknownRows(): CountedTag[] {
    if (!this.searchTerm) return this.unknownRows;
    return this.unknownRows.filter((r) => this.matchesSearch(r.epc));
  }

  // ── Scan mode / limit helpers ────────────────────────────────────────

  onScanModeChange() {
    this.singleHighlightEpc = null;
  }

  get limitReached(): boolean {
    return this.scanMode === 'multi' && this.countedRows.length >= this.maxTags;
  }

  get missingCount(): number {
    if (this.importedEpcs.length > 0) {
      const countedSet = new Set(this.countedMap.keys());
      return this.importedEpcs.filter((epc) => !countedSet.has(epc)).length;
    }
    return this.missingRows.length;
  }

  // ── Distance presets ─────────────────────────────────────────────────

  onDistancePresetChange(dbm: number) {
    this.scanPower = dbm;
  }

  isPresetActive(dbm: number): boolean {
    return this.scanPower === dbm;
  }

  // ── Import / Export ──────────────────────────────────────────────────

  onImportFile(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsBinaryString(file);
    reader.onload = () => {
      const wb = XLSX.read(reader.result, { type: 'binary' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      if (!sheet) return;
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);
      const epcs: string[] = [];
      for (const row of rows) {
        const epc =
          row.EPC || row.epc || row.TagID || row.tagid ||
          row.RFIDCode || row.rfidcode || row.A;
        if (epc) {
          const val = String(epc).trim();
          if (val && !epcs.includes(val)) {
            epcs.push(val);
          }
        }
      }
      if (epcs.length > this.maxTags) {
        this.toastr.danger(`Import limit exceeded: found ${epcs.length}, max ${this.maxTags}`);
      } else {
        this.importedEpcs = epcs;
        this.importedFileName = file.name;
        this.toastr.success(`Imported ${epcs.length} tag(s) from ${file.name}`);
      }
      (event.target as HTMLInputElement).value = '';
    };
  }

  clearImport() {
    this.importedEpcs = [];
    this.importedFileName = '';
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

  // ── Lifecycle ────────────────────────────────────────────────────────

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
        this.allProducts = products;
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

    // New unique tag
    if (this.scanMode === 'multi' && this.countedRows.length >= this.maxTags) {
      this.stopCount();
      this.toastr.warning(`Tag limit reached (${this.maxTags})`);
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

    // Single mode: stop after first unique tag and highlight
    if (this.scanMode === 'single') {
      this.singleHighlightEpc = epc;
      this.stopCount();
    }
  }

  async startCount() {
    if (this.counting) return;
    this.singleHighlightEpc = null;
    try {
      await this.hardwareRfid.ensureConnected();
      await this.hardwareRfid.forceStopInventory();
      await this.hardwareRfid.forceStartInventoryContinuous({ power: this.scanPower });
      this.sessionStart = Date.now();
      this.counting = true;
      this.startRateTimer();
    } catch (err) {
      console.error('[TagCount] start failed:', err);
      this.counting = false;
      this.stopRateTimer();
    }
  }

  private autoStartCounting() {
    if (this.counting) {
      this.ensureCountingAlive();
      return;
    }
    this.startCount();
  }

  private async ensureCountingAlive() {
    if (!this.counting || this.hardwareRfid.isInventoryRunning) return;
    try {
      await this.hardwareRfid.ensureConnected();
      await this.hardwareRfid.forceStopInventory();
      await this.hardwareRfid.forceStartInventoryContinuous({ power: this.scanPower });
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
    this.singleHighlightEpc = null;
    this.searchTerm = '';
    this.loadProducts();
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
