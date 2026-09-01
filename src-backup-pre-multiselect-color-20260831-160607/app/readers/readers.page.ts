import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { HardwareRfidService, SavedReader } from '../services/hardware-rfid.service';
import { ToastrService } from '../services/toastr/toastr.service';
import { ReaderDevice } from '../services/rfid-scanner.models';

@Component({
  selector: 'app-readers',
  templateUrl: './readers.page.html',
  styleUrls: ['./readers.page.scss'],
})
export class ReadersPage implements OnDestroy {
  readers: ReaderDevice[] = [];
  loading = false;
  connectingTo: string | null = null;
  readerConnected = false;
  activeReaderName = '';

  private subs: Subscription[] = [];

  constructor(
    private hardwareRfid: HardwareRfidService,
    private toast: ToastrService
  ) {}

  ionViewDidEnter() {
    this.readerConnected = this.hardwareRfid.isConnected;
    if (this.subs.length === 0) {
      this.subs.push(
        this.hardwareRfid.connected$.subscribe((name) => {
          this.readerConnected = true;
          this.activeReaderName = name || '';
        }),
        this.hardwareRfid.disconnected$.subscribe(() => {
          this.readerConnected = false;
          this.activeReaderName = '';
        })
      );
    }
    this.refresh();
  }

  ionViewDidLeave() {
    // keep page state; refresh on re-entry
  }

  ngOnDestroy() {
    this.subs.forEach((s) => s.unsubscribe());
    this.subs = [];
  }

  async refresh() {
    this.loading = true;
    try {
      const list = await this.hardwareRfid.getAvailableReaders();
      const saved = this.hardwareRfid.getReaderPreference();
      this.readers = list.map((r) => ({
        ...r,
        active: this.isSameReader(r, saved) && this.readerConnected,
      }));
    } catch (err) {
      console.error('[Readers] failed to list readers:', err);
      this.toast.danger('Failed to list readers');
    } finally {
      this.loading = false;
    }
  }

  private isSameReader(r: ReaderDevice, saved: SavedReader | null): boolean {
    if (!saved) return false;
    if (r.address && saved.address && r.address === saved.address) return true;
    if (r.name && saved.name && r.name === saved.name) return true;
    return false;
  }

  async select(reader: ReaderDevice) {
    if (this.connectingTo) return;
    this.connectingTo = reader.name || reader.address;
    try {
      await this.hardwareRfid.connectToReader(reader);
      if (this.hardwareRfid.isConnected) {
        this.activeReaderName = reader.name;
        this.toast.success('Connected to ' + reader.name);
      } else {
        this.toast.warning('No reader connected');
      }
    } catch (err: any) {
      console.error('[Readers] connect failed:', err);
      this.toast.danger('Could not connect to ' + reader.name);
    } finally {
      this.connectingTo = null;
      this.refresh();
    }
  }

  async disconnect() {
    try {
      await this.hardwareRfid.disconnect();
      this.toast.success('Reader disconnected');
    } catch {
      this.toast.danger('Failed to disconnect');
    } finally {
      this.refresh();
    }
  }
}
