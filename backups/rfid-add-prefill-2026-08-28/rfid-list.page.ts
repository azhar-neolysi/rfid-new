import { Component, OnInit, OnDestroy } from '@angular/core';
import { RfidService } from '../rfid.service';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { HardwareRfidService } from '../../services/hardware-rfid.service';
import { ToastrService } from 'src/app/services/toastr/toastr.service';

@Component({
  selector: 'app-rfid-list',
  templateUrl: './rfid-list.page.html',
  styleUrls: ['./rfid-list.page.scss'],
})
export class RfidListPage implements OnInit, OnDestroy {
  rfidItems: any = [];
  rfidItemsTemp: any = [];
  readerConnected = false;
  pageActive = false;
  scannedNotFound = false;
  scannedTag = '';
  private subs: Subscription[] = [];
  constructor(
    private rfid: RfidService,
    private toast: ToastrService,
    private alertCtrl: AlertController,
    private router: Router,
    private hardwareRfid: HardwareRfidService
  ) { }

  ngOnInit() {
    this.readerConnected = this.hardwareRfid.isConnected;
    this.subs.push(
      this.hardwareRfid.connected$.subscribe(() => { this.readerConnected = true; }),
      this.hardwareRfid.disconnected$.subscribe(() => { this.readerConnected = false; }),
      this.hardwareRfid.tagRead$.subscribe((event) => {
        if (!this.pageActive) return;
        const tagId = event.epc;
        if (tagId) {
          this.onTagScanned(tagId);
        }
      })
    );
    this.getRfid();
  }
  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }
  ionViewDidEnter() {
    this.pageActive = true;
    this.hardwareRfid
      .ensureConnected()
      .then(() => this.hardwareRfid.startTriggerScan())
      .catch(() => {});
  }
  ionViewDidLeave() {
    this.pageActive = false;
    this.hardwareRfid.stopTriggerScan().catch(() => {});
  }
  getRfid() {
    this.rfid.getRFIDs().subscribe({
      next: (res: any) => {
        this.rfidItems = res;
        this.rfidItemsTemp = res;
      },
      error: () => this.toast.danger('Failed to load RFID tags'),
    });
  }
  addRFID() {
    this.router.navigate(['rfidmaster']);
  }
  // search(event: any) {
  //   this.rfidItems = this.rfidItemsTemp;
  //   if (event.detail.value === '') {
  //     this.rfidItems = this.rfidItemsTemp;
  //   } else {
  //     this.rfidItems = this.rfidItems.filter((item: any) =>
  //       item.tagId.toLowerCase().includes(event.detail.value.toLowerCase())
  //     );
  //   }
  // }
  search(event: any) {
    const value = event.target.value?.toLowerCase() || '';

    if (!value) {
      this.rfidItems = [...this.rfidItemsTemp];
      this.scannedNotFound = false;
      this.scannedTag = '';
    } else {
      this.rfidItems = this.rfidItemsTemp.filter((item: any) =>
        item.tagId.toLowerCase().includes(value)
      );
    }
  }
  onTagScanned(epc: string) {
    this.scannedNotFound = false;
    this.scannedTag = epc;
    const found = this.rfidItemsTemp.filter(
      (item: any) => String(item.tagId).trim().toLowerCase() === epc.trim().toLowerCase()
    );
    if (found.length > 0) {
      this.rfidItems = found;
    } else {
      this.rfidItems = [];
      this.scannedNotFound = true;
      this.toast.warning('Tag not available');
    }
  }
  addScannedTag() {
    this.router.navigate(['rfidmaster', this.scannedTag]);
  }
  async deleteRFID(id: any) {
    const alert = await this.alertCtrl.create({
      header: 'Confirm Delete',
      message: 'Delete this RFID tag?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.rfid.deleteRFID(id).subscribe({
              next: () => {
                this.toast.success('RFID tag deleted');
                this.rfidItems = this.rfidItems.filter(
                  (item: any) => item.rfidmasterId !== id
                );
                this.rfidItemsTemp = this.rfidItemsTemp.filter(
                  (item: any) => item.rfidmasterId !== id
                );
              },
              error: () => this.toast.danger('Failed to delete RFID tag'),
            });
          },
        },
      ],
    });
    await alert.present();
  }
  editRFID(id: any) {
    this.router.navigate(['rfidmaster', id]);
  }
}
