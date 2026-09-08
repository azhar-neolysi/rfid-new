import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { DevicemasterService } from '../devicemaster.service';
import { ActivatedRoute, Router } from '@angular/router';
import * as XLSX from 'xlsx';
import { FileDownloadService } from '../../services/file-download.service';
import { ToastrService } from '../../services/toastr/toastr.service';

@Component({
  selector: 'app-devicemaster',
  templateUrl: './devicemaster.page.html',
  styleUrls: ['./devicemaster.page.scss'],
})
export class DevicemasterPage implements OnInit {
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
    imei: ['', [Validators.required]],
    deviceModel: ['', [Validators.required]],
    status: ['', [Validators.required]]
  });
  deviceId: any;
  excelUpload = false;
  excelData: any;
  constructor(private formBuilder: FormBuilder, private device: DevicemasterService, private route: ActivatedRoute, private router: Router, private fileDownload: FileDownloadService, private toast: ToastrService) { }
  async downloadTemplate(file: string, event: any) {
    if (this.fileDownload.isNative()) {
      event.preventDefault();
      const saved = await this.fileDownload.templateDownload(file);
      if (saved) {
        this.toast.success('Template downloaded to Downloads/RFID');
      } else {
        this.toast.danger('Could not download the template');
      }
    }
  }

  ngOnInit() {
    console.log(this.deviceForm.value);
    const id = this.route.params.subscribe((param) => {
      // this.editRateId = Number(param.id);
      this.deviceId = param['id'];
      console.log(this.deviceId);
      if (this.deviceId) {
        this.getDevice();
      }
    });
  }
  excelUploadEnable() {
    console.log(this.deviceForm.value);
    this.excelUpload = !this.excelUpload ? true : false;
  }
  addDevice() {
    console.log(this.deviceForm.value);
    if (this.deviceForm.valid) {
      if (this.deviceId) {
        const data = {
          deviceMasterId: this.deviceForm.value.deviceMasterId,
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
          devicePassword: String(this.deviceForm.value.devicePassword),
          description: this.deviceForm.value.description,
          refLocationId: this.deviceForm.value.refLocationId,
          imei: String(this.deviceForm.value.imei),
          deviceModel: this.deviceForm.value.deviceModel,
          status: this.deviceForm.value.status
        };
        console.log(data);
        this.device.editDevice(data).subscribe((res: any) => {
          console.log(res);
          this.router.navigate(['devicemaster-list']);
          // window.location.reload();
        })
      } else {
        console.log(this.deviceForm.value);
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
          devicePassword: String(this.deviceForm.value.devicePassword),
          description: this.deviceForm.value.description,
          refLocationId: this.deviceForm.value.refLocationId,
          imei:String(this.deviceForm.value.imei),
          deviceModel: this.deviceForm.value.deviceModel,
          status: this.deviceForm.value.status
        };
        console.log(data);
        this.device.addDevice(data).subscribe((res: any) => {
          console.log(res);
          this.router.navigate(['devicemaster-list']);
        })
      }

    } else {
      console.log('Form not Valid', this.deviceForm);
    }
  }
  getDevice() {
    this.device.getDevice(this.deviceId).subscribe((res: any) => {
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
      this.deviceForm.controls.imei.setValue(res.imei);
      this.deviceForm.controls.deviceModel.setValue(res.deviceModel);
      this.deviceForm.controls.status.setValue(res.status);
      this.deviceForm.controls.isActive.setValue(res.isActive);
      this.deviceForm.controls.isDeleted.setValue(res.isDeleted);
      this.deviceForm.controls.modifiedDate.setValue(res.modifiedDate);
      this.deviceForm.controls.refCreatedBy.setValue(res.refCreatedBy);
      this.deviceForm.controls.refLocationId.setValue(res.refLocationId);
      this.deviceForm.controls.refModifiedBy.setValue(res.refModifiedBy);
      this.deviceForm.controls.refOrgId.setValue(res.refOrgId);
    })
  }
  onFileSelected(event: any) {
    this.excelData = [];
    const file: any = event.target.files[0];
    console.log(file);
    let fileReader = new FileReader();
    fileReader.readAsBinaryString(file);
    fileReader.onload = (e) => {
      var workbook = XLSX.read(fileReader.result, { type: 'binary' });
      var sheetNames = workbook.SheetNames;
      this.excelData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNames[0]]);
      console.log(this.excelData);
    };
  }
  upload() {
    console.log(this.excelData);
    console.log(this.deviceForm.value);
    let index = 0;
    const processNext = () => {
      if (index >= this.excelData.length) {
        this.router.navigate(['devicemaster-list']);
        return;
      }
      const element = this.excelData[index];
      const data: any = {
        refOrgId: this.deviceForm.value.refOrgId,
        createdDate: new Date(),
        refCreatedBy: this.deviceForm.value.refCreatedBy,
        modifiedDate: new Date(),
        refModifiedBy: this.deviceForm.value.refModifiedBy,
        isActive: true,
        isDeleted: false,
        deviceCode: element.deviceCode,
        deviceName: element.deviceName,
        deviceType: element.deviceType,
        deviceManufacturer: element.deviceManufacturer,
        deviceIpaddress: element.deviceIpaddress,
        deviceMacaddress: element.deviceMacaddress,
        devicePassword: String(element.devicePassword),
        description: element.description,
        refLocationId: element.locationId != null ? element.locationId : null,
        imei: String(element.imei),
        deviceModel: element.deviceModel,
        status: element.status
      };
      this.device.addDevice(data).subscribe((res: any) => {
        console.log(res);
        index++;
        processNext();
      }, (err) => {
        console.log(err);
        index++;
        processNext();
      });
    };
    processNext();
  }
}
