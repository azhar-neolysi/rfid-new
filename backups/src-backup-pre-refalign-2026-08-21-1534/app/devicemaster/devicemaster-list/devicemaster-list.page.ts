import { Component, OnInit } from '@angular/core';
import { DevicemasterService } from '../devicemaster.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-devicemaster-list',
  templateUrl: './devicemaster-list.page.html',
  styleUrls: ['./devicemaster-list.page.scss'],
})
export class DevicemasterListPage implements OnInit {
  deviceList: any = [];
  deviceListTemp: any = [];
  constructor(private device: DevicemasterService, private router: Router) { }

  ngOnInit() {
    this.getDevices();
  }
  getDevices() {
    this.device.getDevices().subscribe((res: any) => {
      console.log(res);
      this.deviceList = res;
      this.deviceListTemp = res;
    });
  }
  addDevice() {
    this.router.navigate(['devicemaster']);
  }
  search(event: any) {
    this.deviceList = this.deviceListTemp;
    console.log(this.deviceList);
    console.log(event.detail.value);
    if (event.detail.value === '') {
      this.deviceList = this.deviceListTemp;

      // this.vehicleList = this.vehicleListTemp;
      // this.vehicleList = this.vehicleList;
    } else {
      this.deviceList = this.deviceList.filter(
        (item: any) =>
          item.deviceCode.toLowerCase().includes(event.detail.value.toLowerCase())
      );
      console.log(this.deviceList);
    }
  }
  deleteDevice(id: any) {
    this.device.deleteDevice(id).subscribe((res: any) => {
      console.log(res);
      window.location.reload();
    });
  }
  editDevice(id: any) {
    this.router.navigate(['devicemaster', id]);
  }
}
