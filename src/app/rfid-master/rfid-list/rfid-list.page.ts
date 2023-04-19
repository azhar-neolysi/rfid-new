import { Component, OnInit } from '@angular/core';
import { RfidService } from '../rfid.service';
import { ToastController } from '@ionic/angular';
import { Route, Router } from '@angular/router';

@Component({
  selector: 'app-rfid-list',
  templateUrl: './rfid-list.page.html',
  styleUrls: ['./rfid-list.page.scss'],
})
export class RfidListPage implements OnInit {
  rfidItems: any = [];
  rfidItemsTemp: any = [];
  constructor(
    private rfid: RfidService,
    private toast: ToastController,
    private router: Router
  ) {}

  ngOnInit() {
    this.getRfid();
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
    });
  }
  editRFID(id: any) {
    this.router.navigate(['rfidmaster', id]);
  }
}
