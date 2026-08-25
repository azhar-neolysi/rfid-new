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
  RFIDScannerPlugin,
  TagReadEvent,
  WriteEpcOptions,
  WriteMemoryOptions,
  WriteResult,
} from './rfid-scanner.models';

const RFIDScanner = registerPlugin<RFIDScannerPlugin>('RFIDScanner');

@Injectable({
  providedIn: 'root',
})
export class HardwareRfidService {
  private tagReadSubject = new Subject<TagReadEvent>();
  private connectedSubject = new Subject<string | undefined>();
  private disconnectedSubject = new Subject<string | undefined>();
  private pairingSubject = new Subject<PairingStatusEvent>();
  private pairingCompleteSubject = new Subject<PairingStatusEvent>();
  private listenersRegistered = false;
  private appListenersRegistered = false;
  private connected = false;
  private inventoryRunning = false;

  get isConnected(): boolean {
    return this.connected;
  }

  get isInventoryRunning(): boolean {
    return this.inventoryRunning;
  }

  readonly tagRead$: Observable<TagReadEvent> = this.tagReadSubject.asObservable();
  readonly connected$: Observable<string | undefined> = this.connectedSubject.asObservable();
  readonly disconnected$: Observable<string | undefined> = this.disconnectedSubject.asObservable();
  readonly pairing$: Observable<PairingStatusEvent> = this.pairingSubject.asObservable();
  readonly pairingComplete$: Observable<PairingStatusEvent> = this.pairingCompleteSubject.asObservable();

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
        }
      });
    });
  }

  connect(options: ConnectOptions = { usb: true, bt: true }): Promise<ConnectionInfo> {
    this.ensureListeners();
    this.ensureAppListeners();
    if (!this.isNativeSupported()) {
      return Promise.resolve({ connected: false });
    }
    return RFIDScanner.connect(options).then((result) => {
      this.connected = !!result?.connected;
      if (this.connected && !this.inventoryRunning) {
        this.startInventory().catch(() => {});
      }
      return result;
    });
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
      await this.connect();
    } catch {
      await this.pairReader();
      await this.connect();
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
