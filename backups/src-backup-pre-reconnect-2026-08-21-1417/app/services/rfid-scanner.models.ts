export interface RFIDScannerPlugin {
  connect(options: ConnectOptions): Promise<ConnectionInfo>;
  disconnect(): Promise<void>;
  pairReader(): Promise<PairResult>;
  getDiagnosticInfo(): Promise<DiagnosticInfo>;
  startInventory(options?: InventoryOptions): Promise<void>;
  stopInventory(): Promise<void>;
  writeEpc(options: WriteEpcOptions): Promise<WriteResult>;
  writeMemory(options: WriteMemoryOptions): Promise<WriteResult>;
  readMemory(options: ReadMemoryOptions): Promise<ReadResult>;
  kill(options: KillOptions): Promise<void>;
  setPower(options: PowerOptions): Promise<void>;
  setBeep(options: BeepOptions): Promise<void>;
  addListener(
    eventName: 'tagRead',
    listener: (event: TagReadEvent) => void
  ): Promise<import('@capacitor/core').PluginListenerHandle>;
  addListener(
    eventName: 'tagDetails',
    listener: (event: TagDetailsEvent) => void
  ): Promise<import('@capacitor/core').PluginListenerHandle>;
  addListener(
    eventName: 'readerConnected' | 'readerDisconnected',
    listener: (event: ReaderStatusEvent) => void
  ): Promise<import('@capacitor/core').PluginListenerHandle>;
  addListener(
    eventName: 'readerPairing' | 'readerPairingComplete',
    listener: (event: PairingStatusEvent) => void
  ): Promise<import('@capacitor/core').PluginListenerHandle>;
  removeAllListeners(): Promise<void>;
}

export interface ConnectOptions {
  usb?: boolean;
  bt?: boolean;
  btName?: string;
}

export interface ConnectionInfo {
  connected: boolean;
  name?: string;
}

export interface PairResult {
  paired: boolean;
  name?: string;
}

export interface PairingStatusEvent {
  status: 'scanning' | 'found' | 'paired' | 'pairing';
  name?: string;
  message?: string;
}

export interface DiagnosticInfo {
  bluetoothEnabled: boolean;
  sdkVersion: number;
  bluetoothConnect?: boolean;
  bluetoothScan?: boolean;
  fineLocation?: boolean;
  bondedDeviceCount?: number;
  bondedDevices?: string;
  readerConnected?: boolean;
  readersSdkInitialized?: boolean;
  pairingInProgress?: boolean;
}

export interface InventoryOptions {
  power?: number;
  beep?: boolean;
}

export interface TagReadEvent {
  epc: string;
  rssi?: number;
  antennaId?: number;
  channelIndex?: number;
}

export interface TagDetailsEvent {
  epc: string;
  tid: string;
  userMemory: string;
}

export interface ReaderStatusEvent {
  name?: string;
}

export interface WriteEpcOptions {
  epc: string;
  targetEpc: string;
  accessPassword?: string;
}

export type MemoryBank = 'RESERVED' | 'EPC' | 'TID' | 'USER';

export interface WriteMemoryOptions {
  epc: string;
  bank: MemoryBank;
  offset?: number;
  data: string;
  accessPassword?: string;
}

export interface ReadMemoryOptions {
  epc: string;
  bank: MemoryBank;
  offset?: number;
  count?: number;
  accessPassword?: string;
}

export interface KillOptions {
  epc: string;
  killPassword: string;
}

export interface PowerOptions {
  power: number;
}

export interface BeepOptions {
  enabled: boolean;
}

export interface WriteResult {
  wordsWritten: number;
}

export interface ReadResult {
  data: string;
}
