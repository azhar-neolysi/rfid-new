import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  Validator,
  Validators,
} from '@angular/forms';
import * as XLSX from 'xlsx';
import { RfidService } from '../rfid.service';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
@Component({
  selector: 'app-rfid-master',
  templateUrl: './rfid-master.page.html',
  styleUrls: ['./rfid-master.page.scss'],
})
export class RfidMasterPage implements OnInit {
  data: any[] = [];
  excelUpload = false;
  readerConnected = false;
  rfidForm = this.formBuilder.group({
    rfidmasterId: [],
    refOrgId: [null],
    createdDate: [new Date()],
    refCreatedBy: [null],
    modifiedDate: [null],
    refModifiedBy: [null],
    isActive: [true],
    isDeleted: [false],
    date: [''],
    tagID: ['', [Validators.required]],
    tagSize: ['', [Validators.required]],
    tagModel: ['', [Validators.required]],
    tagStatus: ['', [Validators.required]],
    frequency: ['', [Validators.required]],
    type: ['', [Validators.required]],
    style: ['', [Validators.required]],
    size: ['', [Validators.required]],
    encodingType: ['', [Validators.required]],
    sysMemoryId: ['', [Validators.required]],
    systemId: ['', [Validators.required]],
    userMemoryId: ['', [Validators.required]],
    memorySize: ['', [Validators.required]],
    isRewritable: [true],
    isAssigned: [false],
    descritpion1: [''],
    descritpion2: [''],
    descritpion3: [''],
  });
  excelData: any = [];
  rfid_Id: any;
  rfidData: any = [];
  maxDate: string;
  constructor(
    private formBuilder: FormBuilder,
    private rfid: RfidService,
    private route: ActivatedRoute,
    private router: Router,
    private datePipe: DatePipe
  ) {
    this.maxDate = new Date().toISOString().split('T')[0];
    this.rfidForm.controls.date.setValue(this.maxDate)
  }

  ngOnInit() {
    // const single_digit = 1;
    // // const two_digits = 03;
    // const prepended_out = String(single_digit).padStart(5, '0');
    // console.log(prepended_out);
    // const prepended_out2 = Math.floor(1000000 + Math.random() * 900000);
    // console.log(prepended_out2);
    // console.log(prepended_out2 + prepended_out);

    const id = this.route.params.subscribe((param) => {
      // this.editRateId = Number(param.id);
      this.rfid_Id = param['id'];
      console.log(this.rfid_Id);
      if (this.rfid_Id) {
        this.getRFIDById();
      }
    });
  }
  excelUploadEnable() {
    this.excelUpload = !this.excelUpload ? true : false;
  }
  getRFIDById() {
    this.rfid.getRFID(this.rfid_Id).subscribe((res: any) => {
      console.log(res);
      console.log(this.datePipe.transform(res.date, 'yyyy-MM-dd'));
      this.rfidData = res;
      this.rfidForm.controls.createdDate.setValue(this.rfidData.createdDate);
      this.rfidForm.controls.date.setValue(
        this.datePipe.transform(res.date, 'yyyy-MM-dd')
      );
      this.rfidForm.controls.descritpion1.setValue(this.rfidData.descritpion1);
      this.rfidForm.controls.descritpion2.setValue(this.rfidData.descritpion2);
      this.rfidForm.controls.descritpion3.setValue(this.rfidData.descritpion3);
      this.rfidForm.controls.encodingType.setValue(this.rfidData.encodingType);
      this.rfidForm.controls.frequency.setValue(this.rfidData.frequency);
      this.rfidForm.controls.isActive.setValue(this.rfidData.isActive);
      this.rfidForm.controls.isDeleted.setValue(this.rfidData.isDeleted);
      this.rfidForm.controls.isAssigned.setValue(this.rfidData.isAssigned);
      this.rfidForm.controls.isRewritable.setValue(this.rfidData.isRewritable);
      this.rfidForm.controls.memorySize.setValue(this.rfidData.memorySize);
      this.rfidForm.controls.modifiedDate.setValue(this.rfidData.modifiedDate);
      this.rfidForm.controls.refCreatedBy.setValue(this.rfidData.refCreatedBy);
      this.rfidForm.controls.refModifiedBy.setValue(
        this.rfidData.refModifiedBy
      );
      this.rfidForm.controls.refOrgId.setValue(this.rfidData.refOrgId);
      this.rfidForm.controls.size.setValue(this.rfidData.size);
      this.rfidForm.controls.style.setValue(this.rfidData.style);
      this.rfidForm.controls.sysMemoryId.setValue(this.rfidData.sysMemoryId);
      this.rfidForm.controls.systemId.setValue(this.rfidData.systemId);
      this.rfidForm.controls.tagID.setValue(this.rfidData.tagId);
      this.rfidForm.controls.tagModel.setValue(this.rfidData.tagModel);
      this.rfidForm.controls.tagSize.setValue(this.rfidData.tagSize);
      this.rfidForm.controls.tagStatus.setValue(this.rfidData.tagStatus);
      this.rfidForm.controls.type.setValue(this.rfidData.type);
      this.rfidForm.controls.userMemoryId.setValue(this.rfidData.userMemoryId);
      this.rfidForm.controls.rfidmasterId.setValue(this.rfidData.rfidmasterId);
      console.log(this.rfidForm);
    });
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
    this.excelData.forEach((element: any) => {
      console.log(element);
      // this.referenceForm.controls.refName.setValue(res.name);
      this.rfidForm.controls.createdDate.setValue(new Date());
      this.rfidForm.controls.date.setValue(element.Date);
      this.rfidForm.controls.descritpion1.setValue(element.Descritpion1);
      this.rfidForm.controls.descritpion2.setValue(element.Descritpion2);
      this.rfidForm.controls.descritpion3.setValue(element.Descritpion3);
      this.rfidForm.controls.encodingType.setValue(element.EncodingType);
      this.rfidForm.controls.frequency.setValue(element.Frequency);
      this.rfidForm.controls.isActive.setValue(true);
      this.rfidForm.controls.isDeleted.setValue(false);
      this.rfidForm.controls.isAssigned.setValue(element.isAssigned === 1 ? true : false);
      this.rfidForm.controls.isRewritable.setValue(element.isRewritable === 1 ? true : false);
      this.rfidForm.controls.memorySize.setValue(element.MemorySize);
      this.rfidForm.controls.modifiedDate.setValue(null);
      this.rfidForm.controls.refCreatedBy.setValue(null);
      this.rfidForm.controls.refModifiedBy.setValue(null);
      this.rfidForm.controls.refOrgId.setValue(null);
      this.rfidForm.controls.size.setValue(String(element.Size));
      this.rfidForm.controls.style.setValue(element.Style);
      this.rfidForm.controls.sysMemoryId.setValue(String(element.SysMemoryId));
      this.rfidForm.controls.systemId.setValue(String(element.SystemId));
      this.rfidForm.controls.tagID.setValue(String(element.TagID));
      this.rfidForm.controls.tagModel.setValue(element.TagModel);
      this.rfidForm.controls.tagSize.setValue(String(element.TagSize));
      this.rfidForm.controls.tagStatus.setValue(element.TagStatus);
      this.rfidForm.controls.type.setValue(element.Type);
      this.rfidForm.controls.userMemoryId.setValue(
        String(element.UserMemoryId)
      );
      console.log(this.rfidForm);
      this.addRFID();
    });
  }
  addRFID() {
    if ((this, this.rfidForm.valid)) {
      if (this.rfid_Id) {
        const data = {
          rfidmasterId: this.rfidForm.value.rfidmasterId,
          refOrgId: this.rfidForm.value.refOrgId,
          createdDate: this.rfidForm.value.createdDate,
          refCreatedBy: this.rfidForm.value.refCreatedBy,
          modifiedDate: this.rfidForm.value.modifiedDate,
          refModifiedBy: this.rfidForm.value.refModifiedBy,
          isActive: this.rfidForm.value.isActive,
          isDeleted: this.rfidForm.value.isDeleted,
          date: this.rfidForm.value.date,
          tagId: this.rfidForm.value.tagID,
          tagSize: this.rfidForm.value.tagSize,
          tagModel: this.rfidForm.value.tagModel,
          tagStatus: this.rfidForm.value.tagStatus,
          frequency: this.rfidForm.value.frequency,
          type: this.rfidForm.value.type,
          style: this.rfidForm.value.style,
          size: this.rfidForm.value.size,
          encodingType: this.rfidForm.value.encodingType,
          sysMemoryId: this.rfidForm.value.sysMemoryId,
          systemId: this.rfidForm.value.systemId,
          userMemoryId: this.rfidForm.value.userMemoryId,
          memorySize: this.rfidForm.value.memorySize,
          isRewritable: this.rfidForm.value.isRewritable,
          isAssigned: this.rfidForm.value.isAssigned,
          descritpion1: this.rfidForm.value.descritpion1,
          descritpion2: this.rfidForm.value.descritpion2,
          descritpion3: this.rfidForm.value.descritpion3,
        };
        console.log(data);
        this.rfid.updateRFID(data).subscribe((res: any) => {
          console.log(res);
          // window.location.reload();
          this.router.navigate(['rfid-list']);
        });
      } else {
        const data = {
          refOrgId: this.rfidForm.value.refOrgId,
          createdDate: this.rfidForm.value.createdDate,
          refCreatedBy: this.rfidForm.value.refCreatedBy,
          modifiedDate: this.rfidForm.value.modifiedDate,
          refModifiedBy: this.rfidForm.value.refModifiedBy,
          isActive: this.rfidForm.value.isActive,
          isDeleted: this.rfidForm.value.isDeleted,
          date: this.rfidForm.value.date,
          tagId: this.rfidForm.value.tagID,
          tagSize: this.rfidForm.value.tagSize,
          tagModel: this.rfidForm.value.tagModel,
          tagStatus: this.rfidForm.value.tagStatus,
          frequency: this.rfidForm.value.frequency,
          type: this.rfidForm.value.type,
          style: this.rfidForm.value.style,
          size: this.rfidForm.value.size,
          encodingType: this.rfidForm.value.encodingType,
          sysMemoryId: this.rfidForm.value.sysMemoryId,
          systemId: this.rfidForm.value.systemId,
          userMemoryId: this.rfidForm.value.userMemoryId,
          memorySize: this.rfidForm.value.memorySize,
          isRewritable: this.rfidForm.value.isRewritable ,
          isAssigned: this.rfidForm.value.isAssigned ,
          // isRewritable: this.rfidForm.value.isRewritable === 1 ? true : false,
          // isAssigned: this.rfidForm.value.isAssigned === 1 ? true : false,
          descritpion1: this.rfidForm.value.descritpion1,
          descritpion2: this.rfidForm.value.descritpion2,
          descritpion3: this.rfidForm.value.descritpion3,
        };
        console.log(data);
        this.rfid.addRFID(data).subscribe((res: any) => {
          console.log(res);
          window.location.reload();
        });
      }
    } else {
      console.log(this.rfidForm);
      console.log('Form Not Valid');
      return;
    }
  }
}
