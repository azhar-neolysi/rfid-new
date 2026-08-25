import { Component, OnInit, OnDestroy } from '@angular/core';
import { RfidService } from '../rfid.service';
import { ToastController } from '@ionic/angular';
import { Route, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { HardwareRfidService } from '../../services/hardware-rfid.service';

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
  private subs: Subscription[] = [];
  constructor(
    private rfid: RfidService,
    private toast: ToastController,
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
          this.router.navigate(['rfidmaster', tagId]);
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
  }
  ionViewDidLeave() {
    this.pageActive = false;
  }
  getRfid() {
    this.rfid.getRFIDs().subscribe((res: any) => {
      console.log(res);
      this.rfidItems = res;
      this.rfidItemsTemp = res;
    });
  }
  addRFID() {
    this.router.navigate(['rfidmaster']);
  }
  search(event: any) {
    console.log(event.detail.value);
    this.rfidItems = this.rfidItemsTemp;
    if (event.detail.value === '') {
      this.rfidItems = this.rfidItemsTemp;
    } else {
      this.rfidItems = this.rfidItems.filter((item: any) =>
        item.tagId.toLowerCase().includes(event.detail.value.toLowerCase())
      );
      console.log(this.rfidItems);
    }
  }
  deleteRFID(id: any) {
    this.rfid.deleteRFID(id).subscribe(async (res: any) => {
      console.log(res);
      const toast = await this.toast.create({
        color: 'success',
        message: 'Sucessfully Deleted',
        position: 'top',
        duration: 2000,
      });
      toast.present();
      toast.onDidDismiss().then(() => {
        // Reload the page or perform the desired action here
        window.location.reload(); // Reloading the page
      });
    });
  }
  editRFID(id: any) {
    this.router.navigate(['rfidmaster', id]);
  }
}
