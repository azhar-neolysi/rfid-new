import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { isValidEpc } from 'src/app/shared/epc.utils';
import { HardwareRfidService } from 'src/app/services/hardware-rfid.service';
import { ToastrService } from 'src/app/services/toastr/toastr.service';

@Component({
  selector: 'app-sale',
  templateUrl: './sale.page.html',
  styleUrls: ['./sale.page.scss'],
})
export class SalePage implements OnInit, OnDestroy {
  tagId: string | null = null;
  readerConnected = false;
  pageActive = false;
  private tagSub: Subscription;
  private subs: Subscription[] = [];

  constructor(
    private router: Router,
    private hardwareRfid: HardwareRfidService,
    private toast: ToastrService
  ) {}

  ngOnInit() {
    this.readerConnected = this.hardwareRfid.isConnected;
    this.subs.push(
      this.hardwareRfid.connected$.subscribe(() => {
        this.readerConnected = true;
        this.toast.success('Reader connected');
      }),
      this.hardwareRfid.disconnected$.subscribe(() => {
        this.readerConnected = false;
        this.toast.warning('Reader disconnected');
      }),
      this.hardwareRfid.inventoryError$.subscribe((msg) => {
        this.toast.danger(msg);
      })
    );
    this.tagSub = this.hardwareRfid.tagRead$.subscribe((event) => {
      if (!this.pageActive) return;
      this.onScan(event.epc);
    });
  }

  ngOnDestroy() {
    this.tagSub?.unsubscribe();
    this.subs.forEach(s => s.unsubscribe());
  }

  ionViewDidEnter() {
    this.pageActive = true;
    this.tagId = null;
  }
  ionViewDidLeave() {
    this.pageActive = false;
  }

  saleEntry() {
    this.router.navigate(['sale-entry']);
  }

  editSale() {
    if (!this.tagId) {
      return;
    }
    this.router.navigate(['sale-entry', this.tagId]);
  }

  onScan(value: string) {
    if (!isValidEpc(value)) {
      this.tagId = null;
      this.toast.warning('Invalid RFID code');
      return;
    }
    this.tagId = value;
    this.editSale();
  }

  clear() {
    this.tagId = null;
  }
}
