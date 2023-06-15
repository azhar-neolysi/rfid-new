import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { ProductService } from 'src/app/itemmaster/product.service';
import { ReferenceListService } from 'src/app/reference-list/reference-list.service';
import { StockService } from '../stock.service';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
@Component({
  selector: 'app-stock-transfer',
  templateUrl: './stock-transfer.page.html',
  styleUrls: ['./stock-transfer.page.scss'],
})
export class StockTransferPage implements OnInit {
  stockForm = this.formBuilder.group({
    stockTransferId: [],
    refOrgId: [null],
    createdDate: [new Date()],
    refCreatedBy: [null],
    modifiedDate: [null],
    refModifiedBy: [null],
    isActive: [true],
    isDeleted: [false],
    date: ['', [Validators.required]],
    productEntryId: [0, [Validators.required]],
    currentStock: [0, [Validators.required]],
    refRefListSourcePoint: [0, [Validators.required]],
    refRefListDestinationPoint: [0, [Validators.required]],
    approvedBy: ['', [Validators.required]],
    reason: ['', [Validators.required]],
    barcode:[''],
    productName:[''],
    printName:[''],
    brand:[''],
    category:[''],
  });
  products: any = [];
  refLists: any = [];
  transferID: any;
  byteLength: number;
  constructor(
    private formBuilder: FormBuilder,
    private product: ProductService,
    private refList: ReferenceListService,
    private stock: StockService,
    private route: ActivatedRoute,
    private datePipe: DatePipe,
    private router: Router
  ) {}

  ngOnInit() {
    this.getProducts();
    this.ref_List();
    const id = this.route.params.subscribe((param) => {
      // this.editRateId = Number(param.id);
      this.transferID = param['id'];
      console.log(this.transferID);
      if (this.transferID) {
        this.getStockTransfer();
      }
    });
  }
  getProducts() {
    this.product.getProducts().subscribe((res: any) => {
      console.log(res);
      this.products = res;
    });
  }
  calculateByteLength(event:any){
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(event.target.value);
    this.byteLength = encodedData.length;
    console.log('byteLength',this.byteLength);
    console.log('RFID ID',event.target.value);
    if(this.byteLength===48){
      // this.tagId=event.target.value
      this.getProduct();
    }
  }
  clear(){
    this.stockForm.controls.barcode.setValue(null);
    this.stockForm.controls.productName.setValue(null);
    this.stockForm.controls.productEntryId.setValue(null);
    this.stockForm.controls.printName.setValue(null);
    this.stockForm.controls.brand.setValue(null);
    this.stockForm.controls.category.setValue(null);
  }

  ref_List() {
    this.refList
      .getReferenceListbyRefName('Transfer Points')
      .subscribe((res: any) => {
        console.log(res);
        this.refLists = res;
      });
  }
  getProduct() {
    // console.log(event);
    // console.log(event.target.value);
    const data = {
      barcode: null,
      rfidcode: this.stockForm.value.barcode,
    };
    this.product.searchProduct(data).subscribe((res: any) => {
      console.log(res);
      this.products=res[0];
      this.stockForm.controls.productName.setValue(res[0].productName);
      this.stockForm.controls.productEntryId.setValue(res[0].productEntryId);
      this.stockForm.controls.printName.setValue(res[0].printName);
      this.stockForm.controls.brand.setValue(res[0].brand);
      this.stockForm.controls.category.setValue(res[0].category);

    });
  }
  transferEntry() {
    if (this.stockForm.valid) {
      if (
        this.stockForm.value.refRefListSourcePoint ===
        this.stockForm.value.refRefListDestinationPoint
      ) {
        console.log('Source and Destination Should not same');
        return;
      }
      if (this.stockForm.value.currentStock === 0) {
        console.log('Enter Transfer Quantity');
        return;
      }

        const data = {
          refOrgId: this.stockForm.value.refOrgId,
          createdDate: this.stockForm.value.createdDate,
          refCreatedBy: this.stockForm.value.refCreatedBy,
          modifiedDate: this.stockForm.value.modifiedDate,
          refModifiedBy: this.stockForm.value.refModifiedBy,
          isActive: this.stockForm.value.isActive,
          isDeleted: this.stockForm.value.isDeleted,
          date: this.stockForm.value.date,
          productEntryId: String(this.stockForm.value.productEntryId),
          currentStock: this.stockForm.value.currentStock,
          refRefListSourcePoint: this.stockForm.value.refRefListSourcePoint,
          refRefListDestinationPoint:
            this.stockForm.value.refRefListDestinationPoint,
          approvedBy: this.stockForm.value.approvedBy,
          reason: this.stockForm.value.reason,
        };
        this.stock.stockTransferEntry(data).subscribe((res: any) => {
          console.log(res);
          window.location.reload();
        });
      // }
    } else {
      console.log('Form Invalid', this.stockForm);
    }
  }
  getStockTransfer() {
    this.stock.getstockTransfer(this.transferID).subscribe((res: any) => {
      console.log(res);
      console.log(this.datePipe.transform(res.date, 'dd-MM-yyyy', 'es-ES'));
      this.stockForm.controls.approvedBy.setValue(res.approvedBy);
      this.stockForm.controls.createdDate.setValue(res.createdDate);
      this.stockForm.controls.currentStock.setValue(res.currentStock);
      this.stockForm.controls.date.setValue(
        this.datePipe.transform(res.date, 'yyyy-MM-dd', 'es-ES')
      );
      // this.dp.transform(myDate, 'yyyy-MM-dd', 'es-ES');
      //new Date().toISOString().split('T')[0];
      this.stockForm.controls.isActive.setValue(res.isActive);
      this.stockForm.controls.isDeleted.setValue(res.isDeleted);
      this.stockForm.controls.modifiedDate.setValue(res.modifiedDate);
      this.stockForm.controls.productEntryId.setValue(
        Number(res.productEntryId)
      );
      this.stockForm.controls.reason.setValue(res.reason);
      this.stockForm.controls.refCreatedBy.setValue(res.refCreatedBy);
      this.stockForm.controls.refModifiedBy.setValue(res.refModifiedBy);
      this.stockForm.controls.refOrgId.setValue(res.refOrgId);
      this.stockForm.controls.refRefListDestinationPoint.setValue(
        res.refRefListDestinationPoint
      );
      this.stockForm.controls.refRefListSourcePoint.setValue(
        res.refRefListSourcePoint
      );
    });
  }
  search(event: any) {
    console.log(event);
    console.log(event.target.value);
    const data = {
      barcode: event.target.value,
      rfidcode: null,
    };
    this.product.searchProduct(data).subscribe((res: any) => {
      console.log(res[0]);
      this.stockForm.controls.productEntryId.setValue(res[0].productEntryId);
      console.log( this.stockForm.value);
      // this.salesForm.controls.currentStock.setValue(res[0].closingQty);
      // // this.salesForm.controls.description.setValue(res[0].description);
      // this.salesForm.controls.isActive.setValue(res[0].isActive);
      // this.salesForm.controls.isDeleted.setValue(res[0].isDeleted);
      // this.salesForm.controls.modifiedDate.setValue(res[0].modifiedDate);
      // this.salesForm.controls.productEntryId.setValue(res[0].productEntryId);
      // this.salesForm.controls.refCreatedBy.setValue(res[0].refCreatedBy);
      // this.salesForm.controls.refModifiedBy.setValue(res[0].refModifiedBy);
      // this.salesForm.controls.refOrgId.setValue(res[0].refOrgId);
      // this.salesForm.controls.rfidstatus.setValue(res[0].rfidstatus);
      // this.salesForm.controls.salesDate.setValue(
      //  new Date()
      // );
    });
  }
  transferList(){
    this.router.navigate(['stock-transfer-list']);
  }
}
