import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { DevicemasterService } from '../devicemaster.service';
import { ActivatedRoute, Router } from '@angular/router';
@Component({
  selector: 'app-devicemaster',
  templateUrl: './devicemaster.page.html',
  styleUrls: ['./devicemaster.page.scss'],
})
export class DevicemasterPage implements OnInit {
  // data = {
  //   deviceMasterId: 0,
  //   refOrgId: 0,
  //   createdDate: '2023-04-18T04:38:30.785Z',
  //   refCreatedBy: 0,
  //   modifiedDate: '2023-04-18T04:38:30.785Z',
  //   refModifiedBy: 0,
  //   isActive: true,
  //   isDeleted: true,
  //   deviceCode: 'string',
  //   deviceName: 'string',
  //   deviceType: 'string',
  //   deviceManufacturer: 'string',
  //   deviceIpaddress: 'string',
  //   deviceMacaddress: 'string',
  //   devicePassword: 'string',
  //   description: 'string',
  //   refLocationId: 0,
  // };
  deviceForm = this.formBuilder.group({
    deviceMasterId: [0],
    refOrgId: [null],
    createdDate: [new Date()],
    refCreatedBy: [null],
    modifiedDate: [new Date()],
    refModifiedBy: [null],
    isActive: [true],
    isDeleted: [false],
    deviceCode: ['', [Validators.required]],
    deviceName: ['', [Validators.required]],
    deviceType: ['', [Validators.required]],
    deviceManufacturer: ['', [Validators.required]],
    deviceIpaddress: ['', [Validators.required]],
    deviceMacaddress: ['', [Validators.required]],
    devicePassword: ['', [Validators.required]],
    description: [''],
    refLocationId: [null],
  });
  deviceId: any;
  constructor(private formBuilder: FormBuilder,private device:DevicemasterService,private route: ActivatedRoute,private router:Router) {}

  ngOnInit() {
    const id = this.route.params.subscribe((param) => {
      // this.editRateId = Number(param.id);
      this.deviceId = param['id'];
      console.log(this.deviceId);
      if (this.deviceId) {
        this.getDevice();
      }
    });
  }
  addDevice() {
    if (this.deviceForm.valid) {
      if(this.deviceId){
        const data = {
          deviceMasterId:this.deviceForm.value.deviceMasterId,
          refOrgId: this.deviceForm.value.refOrgId,
          createdDate: this.deviceForm.value.createdDate,
          refCreatedBy: this.deviceForm.value.refCreatedBy,
          modifiedDate: new Date(),
          refModifiedBy: this.deviceForm.value.refModifiedBy,
          isActive: this.deviceForm.value.isActive,
          isDeleted: this.deviceForm.value.isDeleted,
          deviceCode: this.deviceForm.value.deviceCode,
          deviceName: this.deviceForm.value.deviceName,
          deviceType: this.deviceForm.value.deviceType,
          deviceManufacturer: this.deviceForm.value.deviceManufacturer,
          deviceIpaddress: this.deviceForm.value.deviceIpaddress,
          deviceMacaddress: this.deviceForm.value.deviceMacaddress,
          devicePassword: this.deviceForm.value.devicePassword,
          description: this.deviceForm.value.description,
          refLocationId: null,
        };
        this.device.editDevice(data).subscribe((res:any)=>{
          console.log(res);
          this.router.navigate(['devicemaster-list']);
          // window.location.reload();
        })
      }else{
        const data = {
          refOrgId: this.deviceForm.value.refOrgId,
          createdDate: this.deviceForm.value.createdDate,
          refCreatedBy: this.deviceForm.value.refCreatedBy,
          modifiedDate: this.deviceForm.value.modifiedDate,
          refModifiedBy: this.deviceForm.value.refModifiedBy,
          isActive: this.deviceForm.value.isActive,
          isDeleted: this.deviceForm.value.isDeleted,
          deviceCode: this.deviceForm.value.deviceCode,
          deviceName: this.deviceForm.value.deviceName,
          deviceType: this.deviceForm.value.deviceType,
          deviceManufacturer: this.deviceForm.value.deviceManufacturer,
          deviceIpaddress: this.deviceForm.value.deviceIpaddress,
          deviceMacaddress: this.deviceForm.value.deviceMacaddress,
          devicePassword: this.deviceForm.value.devicePassword,
          description: this.deviceForm.value.description,
          refLocationId: null,
        };
        this.device.addDevice(data).subscribe((res:any)=>{
          console.log(res);
          window.location.reload();
        })
      }

    }else{
      console.log('Form not Valid',this.deviceForm);
    }
  }
  getDevice(){
    this.device.getDevice(this.deviceId).subscribe((res:any)=>{
      console.log(res);
      this.deviceForm.controls.createdDate.setValue(res.createdDate);
      this.deviceForm.controls.description.setValue(res.description);
      this.deviceForm.controls.deviceCode.setValue(res.deviceCode);
      this.deviceForm.controls.deviceIpaddress.setValue(res.deviceIpaddress);
      this.deviceForm.controls.deviceMacaddress.setValue(res.deviceMacaddress);
      this.deviceForm.controls.deviceManufacturer.setValue(res.deviceManufacturer);
      this.deviceForm.controls.deviceMasterId.setValue(res.deviceMasterId);
      this.deviceForm.controls.deviceName.setValue(res.deviceName);
      this.deviceForm.controls.devicePassword.setValue(res.devicePassword);
      this.deviceForm.controls.deviceType.setValue(res.deviceType);
      this.deviceForm.controls.isActive.setValue(res.isActive);
      this.deviceForm.controls.isDeleted.setValue(res.isDeleted);
      this.deviceForm.controls.modifiedDate.setValue(res.modifiedDate);
      this.deviceForm.controls.refCreatedBy.setValue(res.refCreatedBy);
      this.deviceForm.controls.refLocationId.setValue(res.refLocationId);
      this.deviceForm.controls.refModifiedBy.setValue(res.refModifiedBy);
      this.deviceForm.controls.refOrgId.setValue(res.refOrgId);
    })
  }
}
