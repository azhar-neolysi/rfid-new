import { Injectable, NgZone } from '@angular/core';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Observable, Subject } from 'rxjs';
import {
  ConnectOptions,
  ConnectionInfo,
  DiagnosticInfo,
  KillOptions,
  MemoryBank,
  PairResult,
  PairingStatusEvent,
  ReadMemoryOptions,
  ReadResult,
  ReaderDevice,
  ReaderStatus,
  RFIDScannerPlugin,
  TagDetailsEvent,
  TagReadEvent,
  WriteEpcOptions,
  WriteMemoryOptions,
  WriteResult,
} from './rfid-scanner.models';

const RFIDScanner = registerPlugin<RFIDScannerPlugin>('RFIDScanner');

const READER_PREF_KEY = 'rfid_selected_reader';

export interface SavedReader {
  name: string;
  address: string;
  type: 'ZEBRA' | 'UROVO';
  builtIn: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class HardwareRfidService {
  private tagReadSubject = new Subject<TagReadEvent>();
  private tagDetailsSubject = new Subject<TagDetailsEvent>();
  private connectedSubject = new Subject<string | undefined>();
  private disconnectedSubject = new Subject<string | undefined>();
  private pairingSubject = new Subject<PairingStatusEvent>();
  private pairingCompleteSubject = new Subject<PairingStatusEvent>();
  private inventoryErrorSubject = new Subject<string>();
  private listenersRegistered = false;
  private appListenersRegistered = false;
  private connected = false;
  private inventoryRunning = false;
  private connectInFlight: Promise<ConnectionInfo> | null = null;

  get isConnected(): boolean {
    return this.connected;
  }

  get isInventoryRunning(): boolean {
    return this.inventoryRunning;
  }

  readonly tagRead$: Observable<TagReadEvent> = this.tagReadSubject.asObservable();
  readonly tagDetails$: Observable<TagDetailsEvent> = this.tagDetailsSubject.asObservable();
  readonly connected$: Observable<string | undefined> = this.connectedSubject.asObservable();
  readonly disconnected$: Observable<string | undefined> = this.disconnectedSubject.asObservable();
  readonly pairing$: Observable<PairingStatusEvent> = this.pairingSubject.asObservable();
  readonly pairingComplete$: Observable<PairingStatusEvent> = this.pairingCompleteSubject.asObservable();
  readonly inventoryError$: Observable<string> = this.inventoryErrorSubject.asObservable();

  constructor(private zone: NgZone) {}

  isNativeSupported(): boolean {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  }

  private ensureListeners() {
    if (this.listenersRegistered || !this.isNativeSupported()) {
      return;
    }
    this.listenersRegistered = true;
    RFIDScanner.addListener('tagRead', (event: TagReadEvent) => {
      this.zone.run(() => {
        this.tagReadSubject.next(event);
      });
    });
    RFIDScanner.addListener('tagDetails', (event: TagDetailsEvent) => {
      this.zone.run(() => {
        this.tagDetailsSubject.next(event);
      });
    });
    RFIDScanner.addListener('readerConnected', (event: any) => {
      this.zone.run(() => {
        this.connected = true;
        this.connectedSubject.next(event?.name);
      });
    });
    RFIDScanner.addListener('readerDisconnected', (event: any) => {
      this.zone.run(() => {
        this.connected = false;
        this.inventoryRunning = false;
        this.disconnectedSubject.next(event?.name);
      });
    });
    RFIDScanner.addListener('readerPairing', (event: PairingStatusEvent) => {
      this.zone.run(() => {
        this.pairingSubject.next(event);
      });
    });
    RFIDScanner.addListener('readerPairingComplete', (event: PairingStatusEvent) => {
      this.zone.run(() => {
        this.pairingCompleteSubject.next(event);
      });
    });
  }

  private ensureAppListeners() {
    if (this.appListenersRegistered || !this.isNativeSupported()) {
      return;
    }
    this.appListenersRegistered = true;
    App.addListener('appStateChange', ({ isActive }) => {
      this.zone.run(() => {
        if (!isActive && this.inventoryRunning) {
          this.stopInventory().catch(() => {});
        } else if (isActive) {
          // App came back to foreground (screen on / reopened): reconcile
          // our flags with the native reader state and self-heal.
          this.syncFromNative();
        }
      });
    });
  }

  /**
   * Reconcile cached connection/inventory flags with native truth. Emits
   * connected$/disconnected$ when the real state differs, and attempts one
   * silent reconnect if the reader dropped while the app was away.
   */
  syncFromNative(): Promise<void> {
    if (!this.isNativeSupported()) {
      return Promise.resolve();
    }
    return RFIDScanner.getStatus()
      .then((status: ReaderStatus) => {
        const nativeConnected = !!status?.connected;
        const nativeRunning = !!status?.inventoryRunning;
        this.inventoryRunning = nativeRunning;
        if (nativeConnected !== this.connected) {
          this.connected = nativeConnected;
          if (nativeConnected) {
            this.connectedSubject.next(undefined);
          } else {
            this.disconnectedSubject.next(undefined);
          }
        }
        if (!nativeConnected) {
          // Silent reconnect attempt (no pairing fallback loop).
          this.connect(this.connectOptions()).catch(() => {});
        }
      })
      .catch(() => {});
  }

  connect(options: ConnectOptions = { usb: true, bt: true }): Promise<ConnectionInfo> {
    this.ensureListeners();
    this.ensureAppListeners();
    if (!this.isNativeSupported()) {
      return Promise.resolve({ connected: false });
    }
    if (this.connectInFlight) {
      return this.connectInFlight;
    }
    this.connectInFlight = RFIDScanner.connect(options)
      .then((result) => {
        this.connected = !!result?.connected;
        return result;
      })
      .finally(() => {
        this.connectInFlight = null;
      });
    return this.connectInFlight;
  }

  getAvailableReaders(): Promise<ReaderDevice[]> {
    if (!this.isNativeSupported()) {
      return Promise.resolve([]);
    }
    return RFIDScanner.getAvailableReaders().then((r) => r.readers || []);
  }

  saveReaderPreference(reader: SavedReader): void {
    try {
      localStorage.setItem(READER_PREF_KEY, JSON.stringify(reader));
    } catch {
      // storage unavailable (private mode etc.)
    }
  }

  getReaderPreference(): SavedReader | null {
    try {
      const raw = localStorage.getItem(READER_PREF_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as SavedReader;
      if (parsed && (parsed.name || parsed.address)) return parsed;
      return null;
    } catch {
      return null;
    }
  }

  clearReaderPreference(): void {
    try {
      localStorage.removeItem(READER_PREF_KEY);
    } catch {
      // ignore
    }
  }

  /**
   * Build connect options that honour the user-selected reader (if any).
   * Falls back to plain auto-connect ({usb,bt}) when no preference is saved.
   */
  private connectOptions(pref?: SavedReader | null): ConnectOptions {
    const base: ConnectOptions = { usb: true, bt: true };
    const p = pref ?? this.getReaderPreference();
    if (p) {
      // For external Zebra readers we target them via their Bluetooth name or
      // MAC. Built-in Urovo needs no btName.
      if (p.type === 'UROVO') {
        base.btName = p.name || p.address || undefined;
        return base;
      }
      base.btName = p.name || p.address || undefined;
    }
    return base;
  }

  /**
   * Connect to a specific reader and persist that choice for this device
   * so later ensureConnected()/reconnects keep using it.
   */
  async connectToReader(reader: ReaderDevice): Promise<ConnectionInfo> {
    const pref: SavedReader = {
      name: reader.name,
      address: reader.address,
      type: reader.type,
      builtIn: reader.builtIn,
    };
    if (!this.isNativeSupported()) {
      return { connected: false };
    }
    if (this.connected) {
      await this.disconnect();
    }
    this.saveReaderPreference(pref);
    const result = await this.connect(this.connectOptions(pref));
    return result;
  }

  pairReader(): Promise<PairResult> {
    this.ensureListeners();
    if (!this.isNativeSupported()) {
      return Promise.resolve({ paired: false });
    }
    return RFIDScanner.pairReader();
  }

  getDiagnosticInfo(): Promise<DiagnosticInfo> {
    if (!this.isNativeSupported()) {
      return Promise.resolve({ bluetoothEnabled: false, sdkVersion: 0 });
    }
    return RFIDScanner.getDiagnosticInfo();
  }

  disconnect(): Promise<void> {
    if (!this.isNativeSupported()) {
      return Promise.resolve();
    }
    return RFIDScanner.disconnect().then(() => {
      this.connected = false;
      this.inventoryRunning = false;
    });
  }

  async ensureConnected(): Promise<void> {
    if (this.isConnected) return;
    try {
      await this.connect(this.connectOptions());
    } catch {
      await this.pairReader();
      await this.connect(this.connectOptions());
    }
  }

  startInventory(options?: { power?: number; beep?: boolean }): Promise<void> {
    if (!this.isNativeSupported()) {
      return Promise.resolve();
    }
    if (this.inventoryRunning) {
      return Promise.resolve();
    }
    return RFIDScanner.startInventory(options).then(() => {
      this.inventoryRunning = true;
    }).catch((err) => {
      console.error('[RFID] startInventory failed:', err);
      this.inventoryRunning = false;
      throw err;
    });
  }

  stopInventory(): Promise<void> {
    if (!this.isNativeSupported()) {
      return Promise.resolve();
    }
    if (!this.inventoryRunning) {
      return Promise.resolve();
    }
    return RFIDScanner.stopInventory().then(() => {
      this.inventoryRunning = false;
    }).catch((err) => {
      console.error('[RFID] stopInventory failed:', err);
      this.inventoryRunning = false;
      throw err;
    });
  }

  /**
   * Arm an on-demand, handheld-trigger scan: stops any running session and
   * starts a non-continuous session so the physical trigger scans while held
   * and stops when released (no continuous beeping).
   */
  async startTriggerScan(): Promise<void> {
    if (!this.isNativeSupported()) return;
    await this.forceStopInventory();
    await this.startInventory();
  }

  /** Disarm the on-demand handheld-trigger scan session. */
  async stopTriggerScan(): Promise<void> {
    if (!this.isNativeSupported()) return;
    await this.stopInventory();
  }

  /** Native stop that ignores the cached running flag (self-heals stale state). */
  forceStopInventory(): Promise<void> {
    if (!this.isNativeSupported()) {
      return Promise.resolve();
    }
    return RFIDScanner.stopInventory().then(() => {
      this.inventoryRunning = false;
    }).catch((err) => {
      console.error('[RFID] forceStopInventory failed:', err);
      this.inventoryRunning = false;
      throw err;
    });
  }

  /** Native start that ignores the cached running flag (self-heals stale state). */
  forceStartInventory(options?: { power?: number; beep?: boolean }): Promise<void> {
    if (!this.isNativeSupported()) {
      return Promise.reject(new Error('RFID hardware not available on this platform'));
    }
    return RFIDScanner.startInventory(options).then(() => {
      this.inventoryRunning = true;
    }).catch((err) => {
      console.error('[RFID] forceStartInventory failed:', err);
      this.inventoryRunning = false;
      throw err;
    });
  }

  /**
   * Software-driven continuous inventory: runs without holding the hardware
   * trigger and ignores the cached running flag (self-heals stale state).
   */
  forceStartInventoryContinuous(options?: { power?: number }): Promise<void> {
    if (!this.isNativeSupported()) {
      return Promise.reject(new Error('RFID hardware not available on this platform'));
    }
    return RFIDScanner.startInventory({ ...(options || {}), continuous: true }).then(() => {
      this.inventoryRunning = true;
    }).catch((err) => {
      console.error('[RFID] forceStartInventoryContinuous failed:', err);
      this.inventoryRunning = false;
      throw err;
    });
  }

  writeEpc(options: WriteEpcOptions): Promise<WriteResult> {
    if (!this.isNativeSupported()) {
      return Promise.reject(new Error('RFID hardware not available on this platform'));
    }
    return RFIDScanner.writeEpc(options);
  }

  writeMemory(options: WriteMemoryOptions): Promise<WriteResult> {
    if (!this.isNativeSupported()) {
      return Promise.reject(new Error('RFID hardware not available on this platform'));
    }
    return RFIDScanner.writeMemory(options);
  }

  readMemory(options: ReadMemoryOptions): Promise<ReadResult> {
    if (!this.isNativeSupported()) {
      return Promise.reject(new Error('RFID hardware not available on this platform'));
    }
    return RFIDScanner.readMemory(options);
  }

  kill(options: KillOptions): Promise<void> {
    if (!this.isNativeSupported()) {
      return Promise.reject(new Error('RFID hardware not available on this platform'));
    }
    return RFIDScanner.kill(options);
  }

  setPower(power: number): Promise<void> {
    if (!this.isNativeSupported()) {
      return Promise.resolve();
    }
    return RFIDScanner.setPower({ power });
  }

  setBeep(enabled: boolean): Promise<void> {
    if (!this.isNativeSupported()) {
      return Promise.resolve();
    }
    return RFIDScanner.setBeep({ enabled });
  }
}
