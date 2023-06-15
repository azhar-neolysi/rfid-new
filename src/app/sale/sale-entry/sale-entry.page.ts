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
import { ProductService } from 'src/app/itemmaster/product.service';
import { ToastController } from '@ionic/angular';
@Component({
  selector: 'app-sale-entry',
  templateUrl: './sale-entry.page.html',
  styleUrls: ['./sale-entry.page.scss'],
})
export class SaleEntryPage implements OnInit {
  salesForm = this.formBuilder.group({
    salesId: [],
    refOrgId: [null],
    createdDate: [new Date()],
    refCreatedBy: [null],
    modifiedDate: [null],
    refModifiedBy: [null],
    isActive: [true],
    isDeleted: [false],
    salesDate: [new Date(), [Validators.required]],
    productEntryId: ['', [Validators.required]],
    currentStock: [1, [Validators.required]],
    rfidstatus: ['Kill'],
    rfidId: [''],
    description: ['Sale'],
    productName:[''],
    printName:[''],
    brand:[''],
    category:[''],
    mrp:[''],
    saleRate:[''],
  });
  salesID: any;
  products: any=[];
  byteLength: number;
  constructor(
    private sale: SaleService,
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private datePipe: DatePipe,
    private product: ProductService,
    private toast:ToastController
  ) {}

  ngOnInit() {
    const id = this.route.params.subscribe((param) => {
      // this.editRateId = Number(param.id);
      this.salesID = param['id'];
      console.log(this.salesID);
      if (this.salesID) {
        this.getProduct();
      }
    });
  }
  saleEntry() {
    if (this.salesForm.valid) {
      // if (this.salesID) {
      //   const data = {
      //     salesId: this.salesForm.value.salesId,
      //     refOrgId: this.salesForm.value.refOrgId,
      //     createdDate: this.salesForm.value.createdDate,
      //     refCreatedBy: this.salesForm.value.refCreatedBy,
      //     modifiedDate: this.salesForm.value.modifiedDate,
      //     refModifiedBy: this.salesForm.value.refModifiedBy,
      //     isActive: this.salesForm.value.isActive,
      //     isDeleted: this.salesForm.value.isDeleted,
      //     salesDate: new Date(),
      //     productEntryId: this.salesForm.value.productEntryId,
      //     currentStock: this.salesForm.value.currentStock,
      //     rfidstatus: this.salesForm.value.rfidstatus,
      //     description: this.salesForm.value.description,
      //   };
      //   console.log(data);
      //   this.sale.editSale(data).subscribe((res: any) => {
      //     console.log(res);
      //     window.location.reload();
      //   });
      // } else {
        const data = {
          refOrgId: this.salesForm.value.refOrgId,
          // createdDate: this.salesForm.value.createdDate,
          refCreatedBy: this.salesForm.value.refCreatedBy,
          // modifiedDate: this.salesForm.value.modifiedDate,
          refModifiedBy: this.salesForm.value.refModifiedBy,
          // isActive: this.salesForm.value.isActive,
          // isDeleted: this.salesForm.value.isDeleted,
          salesDate: new Date(),
          refProductEntryId: this.salesForm.value.productEntryId,
          currentStock: String(this.salesForm.value.currentStock),
          rfidstatus: this.salesForm.value.rfidstatus,
          description: this.salesForm.value.description,
        };

        console.log(data);
        this.sale.saleEntry(data).subscribe((res: any) => {
          console.log(res);
          console.log(this.products);
          this.products.quantity=this.products.quantity-Number(this.salesForm.value.currentStock);
          this.products.modifiedDate=new Date();
          // this.products.date=new Date();
          console.log(this.products);
          this.product.updateProduct(this.products).subscribe((res:any)=>{

            this.router.navigate(['sale']);
          })
        });
      // }
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
      this.salesForm.controls.productEntryId.setValue(res.productEntryId);
      this.salesForm.controls.refCreatedBy.setValue(res.refCreatedBy);
      this.salesForm.controls.refModifiedBy.setValue(res.refModifiedBy);
      this.salesForm.controls.refOrgId.setValue(res.refOrgId);
      this.salesForm.controls.rfidstatus.setValue(res.rfidstatus);
      // this.salesForm.controls.salesDate.setValue(
      //   this.datePipe.transform(res.salesDate, 'yyyy-MM-dd')
      // );
      this.salesForm.controls.salesId.setValue(res.salesId);
    });
  }
  getProduct() {
    // console.log(event);
    // console.log(event.target.value);
    const data = {
      barcode: null,
      rfidcode: this.salesID,
    };
    this.product.searchProduct(data).subscribe(async (res: any) => {
      console.log(res);
      this.products=res[0];
      this.salesForm.controls.productName.setValue(res[0].productName);
      this.salesForm.controls.productEntryId.setValue(res[0].productEntryId);
      this.salesForm.controls.printName.setValue(res[0].printName);
      this.salesForm.controls.brand.setValue(res[0].brand);
      this.salesForm.controls.category.setValue(res[0].category);
      this.salesForm.controls.mrp.setValue(res[0].mrp);
      this.salesForm.controls.saleRate.setValue(res[0].salesRate);
      if(this.products.length !==0){
        this.saleEntry();
      }else{
        const toast = await this.toast.create({
          message: 'Invalid RFID Tag ID',
          duration: 2000,
          position: 'top',
          color: 'warning',
        });
        toast.present();
        this.router.navigate(['sale']);
        // window.location.reload();
      }
    });
  }
  calculateByteLength(event:any){
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(event.target.value);
    this.byteLength = encodedData.length;
    console.log('byteLength',this.byteLength);
  }
}
