import { Component, OnInit } from '@angular/core';
import { DevicemasterService } from '../devicemaster.service';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { ToastrService } from 'src/app/services/toastr/toastr.service';

@Component({
  selector: 'app-devicemaster-list',
  templateUrl: './devicemaster-list.page.html',
  styleUrls: ['./devicemaster-list.page.scss'],
})
export class DevicemasterListPage implements OnInit {
  deviceList: any = [];
  deviceListTemp: any = [];
  constructor(
    private device: DevicemasterService,
    private router: Router,
    private alertCtrl: AlertController,
    private toast: ToastrService
  ) { }

  ngOnInit() {
    this.getDevices();
  }
  getDevices() {
    this.device.getDevices().subscribe({
      next: (res: any) => {
        this.deviceList = res;
        this.deviceListTemp = res;
      },
      error: () => this.toast.danger('Failed to load devices'),
    });
  }
  addDevice() {
    this.router.navigate(['devicemaster']);
  }
  search(event: any) {
    this.deviceList = this.deviceListTemp;
    if (event.detail.value === '') {
      this.deviceList = this.deviceListTemp;
    } else {
      this.deviceList = this.deviceList.filter(
        (item: any) =>
          item.deviceCode.toLowerCase().includes(event.detail.value.toLowerCase())
      );
    }
  }
  async deleteDevice(id: any) {
    const alert = await this.alertCtrl.create({
      header: 'Confirm Delete',
      message: 'Delete this device?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.device.deleteDevice(id).subscribe({
              next: () => {
                this.toast.success('Device deleted');
                this.deviceList = this.deviceList.filter(
                  (item: any) => item.deviceMasterId !== id
                );
                this.deviceListTemp = this.deviceListTemp.filter(
                  (item: any) => item.deviceMasterId !== id
                );
              },
              error: () => this.toast.danger('Failed to delete device'),
            });
          },
        },
      ],
    });
    await alert.present();
  }
  editDevice(id: any) {
    this.router.navigate(['devicemaster', id]);
  }
}
