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
    productMasterId: [1, [Validators.required]],
    currentStock: [0, [Validators.required]],
    refRefListSourcePoint: [0, [Validators.required]],
    refRefListDestinationPoint: [0, [Validators.required]],
    approvedBy: ['', [Validators.required]],
    reason: ['', [Validators.required]],
  });
  products: any = [];
  refLists: any = [];
  transferID: any;
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
  // selectProduct(productId: any) {
  //   console.log(productId);
  //   this.products.forEach((element: any) => {
  //     console.log(element);
  //     if(element.productMasterId === productId){
  //       this.
  //     }
  //   });
  // }
  ref_List() {
    this.refList
      .getReferenceListbyRefName('Transfer Points')
      .subscribe((res: any) => {
        console.log(res);
        this.refLists = res;
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
      if (this.transferID) {
        const data = {
          stockTransferId: this.stockForm.value.stockTransferId,
          refOrgId: this.stockForm.value.refOrgId,
          createdDate: this.stockForm.value.createdDate,
          refCreatedBy: this.stockForm.value.refCreatedBy,
          modifiedDate: this.stockForm.value.modifiedDate,
          refModifiedBy: this.stockForm.value.refModifiedBy,
          isActive: this.stockForm.value.isActive,
          isDeleted: this.stockForm.value.isDeleted,
          date: this.stockForm.value.date,
          productMasterId: String(this.stockForm.value.productMasterId),
          currentStock: this.stockForm.value.currentStock,
          refRefListSourcePoint: this.stockForm.value.refRefListSourcePoint,
          refRefListDestinationPoint:
            this.stockForm.value.refRefListDestinationPoint,
          approvedBy: this.stockForm.value.approvedBy,
          reason: this.stockForm.value.reason,
        };
        console.log(data);
        this.stock.editStockTransfer(data).subscribe((res: any) => {
          console.log(res);
          this.router.navigate(['stock-transfer-list']);
        });
      } else {
        const data = {
          stockTransferId: this.stockForm.value.stockTransferId,
          refOrgId: this.stockForm.value.refOrgId,
          createdDate: this.stockForm.value.createdDate,
          refCreatedBy: this.stockForm.value.refCreatedBy,
          modifiedDate: this.stockForm.value.modifiedDate,
          refModifiedBy: this.stockForm.value.refModifiedBy,
          isActive: this.stockForm.value.isActive,
          isDeleted: this.stockForm.value.isDeleted,
          date: this.stockForm.value.date,
          productMasterId: String(this.stockForm.value.productMasterId),
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
      }
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
      this.stockForm.controls.productMasterId.setValue(
        Number(res.productMasterId)
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
}
