import { Component, OnInit } from '@angular/core';
import { SaleService } from '../sale.service';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
@Component({
  selector: 'app-sale-entry',
  templateUrl: './sale-entry.page.html',
  styleUrls: ['./sale-entry.page.scss'],
})
export class SaleEntryPage implements OnInit {
  salesForm = this.formBuilder.group({
    salesId:[],
    refOrgId: [null],
    createdDate: [new Date()],
    refCreatedBy: [null],
    modifiedDate: [null],
    refModifiedBy: [null],
    isActive: [true],
    isDeleted: [false],
    salesDate: ['', [Validators.required]],
    productMasterId: ['', [Validators.required]],
    currentStock: ['', [Validators.required]],
    rfidstatus: ['Kill'],
    description: [''],
  });
  salesID: any;
  constructor(
    private sale: SaleService,
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private datePipe: DatePipe
  ) {}

  ngOnInit() {
    const id = this.route.params.subscribe((param) => {
      // this.editRateId = Number(param.id);
      this.salesID = param['id'];
      console.log(this.salesID);
      if (this.salesID) {
        this.getSale();
      }
    });
  }
  saleEntry() {
    if (this.salesForm.valid) {
      if(this.salesID){
        const data = {
          salesId:this.salesForm.value.salesId,
          refOrgId: this.salesForm.value.refOrgId,
          createdDate: this.salesForm.value.createdDate,
          refCreatedBy: this.salesForm.value.refCreatedBy,
          modifiedDate: this.salesForm.value.modifiedDate,
          refModifiedBy: this.salesForm.value.refModifiedBy,
          isActive: this.salesForm.value.isActive,
          isDeleted: this.salesForm.value.isDeleted,
          salesDate: this.salesForm.value.salesDate,
          productMasterId: this.salesForm.value.productMasterId,
          currentStock: this.salesForm.value.currentStock,
          rfidstatus: this.salesForm.value.rfidstatus,
          description: this.salesForm.value.description,
        };
        console.log(data);
        this.sale.editSale(data).subscribe((res: any) => {
          console.log(res);
          window.location.reload();
        });
      }else{
        const data = {
          refOrgId: this.salesForm.value.refOrgId,
          createdDate: this.salesForm.value.createdDate,
          refCreatedBy: this.salesForm.value.refCreatedBy,
          modifiedDate: this.salesForm.value.modifiedDate,
          refModifiedBy: this.salesForm.value.refModifiedBy,
          isActive: this.salesForm.value.isActive,
          isDeleted: this.salesForm.value.isDeleted,
          salesDate: this.salesForm.value.salesDate,
          productMasterId: this.salesForm.value.productMasterId,
          currentStock: this.salesForm.value.currentStock,
          rfidstatus: this.salesForm.value.rfidstatus,
          description: this.salesForm.value.description,
        };
        this.sale.saleEntry(data).subscribe((res: any) => {
          console.log(res);
          window.location.reload();
        });
      }

    } else {
      console.log('Invalid Form', this.salesForm);
    }
  }
  getSale() {
    this.sale.getSale(this.salesID).subscribe((res: any) => {
      console.log(res);
      this.salesForm.controls.createdDate.setValue(res.createdDate);
      this.salesForm.controls.currentStock.setValue(res.currentStock);
      this.salesForm.controls.description.setValue(res.description);
      this.salesForm.controls.isActive.setValue(res.isActive);
      this.salesForm.controls.isDeleted.setValue(res.isDeleted);
      this.salesForm.controls.modifiedDate.setValue(res.modifiedDate);
      this.salesForm.controls.productMasterId.setValue(res.productMasterId);
      this.salesForm.controls.refCreatedBy.setValue(res.refCreatedBy);
      this.salesForm.controls.refModifiedBy.setValue(res.refModifiedBy);
      this.salesForm.controls.refOrgId.setValue(res.refOrgId);
      this.salesForm.controls.rfidstatus.setValue(res.rfidstatus);
      this.salesForm.controls.salesDate.setValue(
        this.datePipe.transform(res.salesDate, 'yyyy-MM-dd'));
        this.salesForm.controls.salesId.setValue(res.salesId);
    });
  }
}
