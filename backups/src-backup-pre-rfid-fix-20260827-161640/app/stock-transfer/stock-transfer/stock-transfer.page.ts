import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { ProductService } from 'src/app/itemmaster/product.service';
import { ReferenceListService } from 'src/app/reference-list/reference-list.service';
import { StockService } from '../stock.service';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { HardwareRfidService } from 'src/app/services/hardware-rfid.service';
import { ToastrService } from 'src/app/services/toastr/toastr.service';
@Component({
  selector: 'app-stock-transfer',
  templateUrl: './stock-transfer.page.html',
  styleUrls: ['./stock-transfer.page.scss'],
})
export class StockTransferPage implements OnInit, OnDestroy {
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
  readerConnected = false;
  pageActive = false;
  private subs: Subscription[] = [];
  constructor(
    private formBuilder: FormBuilder,
    private product: ProductService,
    private refList: ReferenceListService,
    private stock: StockService,
    private route: ActivatedRoute,
    private datePipe: DatePipe,
    private router: Router,
    private hardwareRfid: HardwareRfidService,
    private toast: ToastrService
  ) {}

  ngOnInit() {
    this.readerConnected = this.hardwareRfid.isConnected;
    this.subs.push(
      this.hardwareRfid.connected$.subscribe(() => { this.readerConnected = true; }),
      this.hardwareRfid.disconnected$.subscribe(() => { this.readerConnected = false; }),
      this.hardwareRfid.tagRead$.subscribe((event) => {
        if (!this.pageActive) return;
        this.stockForm.controls.barcode.setValue(event.epc);
        this.getProduct();
      })
    );
    this.getProducts();
    this.ref_List();
    const id = this.route.params.subscribe((param) => {
      // this.editRateId = Number(param.id);
      this.transferID = param['id'];
      if (this.transferID) {
        this.getStockTransfer();
      }
    });
  }
  getProducts() {
    this.product.getProducts().subscribe((res: any) => {
      this.products = res;
    });
  }
  calculateByteLength(event:any){
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(event.target.value);
    this.byteLength = encodedData.length;
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
      .subscribe({
        next: (res: any) => {
          this.refLists = res;
        },
        error: () => this.toast.danger('Failed to load transfer points'),
      });
  }
  getProduct() {
    // console.log(event);
    // console.log(event.target.value);
    const data = {
      barcode: null,
      rfidcode: this.stockForm.value.barcode,
    };
    this.product.searchProduct(data).subscribe({
      next: (res: any) => {
        if (!res || res.length === 0) {
          this.toast.warning('No product found for this barcode');
          return;
        }
        this.products = res[0];
        this.stockForm.controls.productName.setValue(res[0].productName);
        this.stockForm.controls.productEntryId.setValue(res[0].productEntryId);
        this.stockForm.controls.printName.setValue(res[0].printName);
        this.stockForm.controls.brand.setValue(res[0].brand);
        this.stockForm.controls.category.setValue(res[0].category);
      },
      error: () => this.toast.danger('Failed to find product'),
    });
  }
  transferEntry() {
    if (this.stockForm.valid) {
      if (
        this.stockForm.value.refRefListSourcePoint ===
        this.stockForm.value.refRefListDestinationPoint
      ) {
        this.toast.warning('Source and Destination should not be the same');
        return;
      }
      if (!this.stockForm.value.currentStock) {
        this.toast.warning('Enter Transfer Quantity');
        return;
      }

        const data = {
          stockTransferId: this.transferID || undefined,
          refOrgId: this.stockForm.value.refOrgId,
          createdDate: this.stockForm.value.createdDate,
          refCreatedBy: this.stockForm.value.refCreatedBy,
          modifiedDate: this.stockForm.value.modifiedDate,
          refModifiedBy: this.stockForm.value.refModifiedBy,
          isActive: this.stockForm.value.isActive,
          isDeleted: this.stockForm.value.isDeleted,
          date: this.stockForm.value.date,
          refProductEntryId: String(this.stockForm.value.productEntryId),
          qty: this.stockForm.value.currentStock,
          refRefListSourcePoint: this.stockForm.value.refRefListSourcePoint,
          refRefListDestinationPoint:
            this.stockForm.value.refRefListDestinationPoint,
          approvedBy: this.stockForm.value.approvedBy,
          reason: this.stockForm.value.reason,
        };
        if (this.transferID) {
          this.stock.editStockTransfer(data).subscribe({
            next: () => {
              this.toast.success('Record Saved Successfully');
              this.router.navigate(['stock-transfer-list']);
            },
            error: () => this.toast.danger('Failed to save stock transfer'),
          });
        } else {
          this.stock.stockTransferEntry(data).subscribe({
            next: () => {
              this.toast.success('Record Saved Successfully');
              this.router.navigate(['stock-transfer-list']);
            },
            error: () => this.toast.danger('Failed to save stock transfer'),
          });
        }
    } else {
      this.toast.danger('Please fill all required fields');
    }
  }
  getStockTransfer() {
    this.stock.getstockTransfer(this.transferID).subscribe({
      next: (res: any) => {
      this.stockForm.controls.approvedBy.setValue(res.approvedBy);
      this.stockForm.controls.createdDate.setValue(res.createdDate);
      this.stockForm.controls.currentStock.setValue(res.qty);
      this.stockForm.controls.date.setValue(
        this.datePipe.transform(res.date, 'yyyy-MM-dd', 'es-ES')
      );
      // this.dp.transform(myDate, 'yyyy-MM-dd', 'es-ES');
      //new Date().toISOString().split('T')[0];
      this.stockForm.controls.isActive.setValue(res.isActive);
      this.stockForm.controls.isDeleted.setValue(res.isDeleted);
      this.stockForm.controls.modifiedDate.setValue(res.modifiedDate);
      this.stockForm.controls.productEntryId.setValue(
        Number(res.refProductEntryId)
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
      },
      error: () => this.toast.danger('Failed to load stock transfer'),
    });
  }
  search(event: any) {
    if (!event.target.value) return;
    const data = {
      barcode: event.target.value,
      rfidcode: null,
    };
    this.product.searchProduct(data).subscribe({
      next: (res: any) => {
        if (!res || res.length === 0) {
          this.toast.warning('No product found for this barcode');
          return;
        }
        this.stockForm.controls.productEntryId.setValue(res[0].productEntryId);
      },
      error: () => this.toast.danger('Failed to find product'),
    });
  }
  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }
  ionViewDidEnter() {
    this.pageActive = true;
  }
  ionViewDidLeave() {
    this.pageActive = false;
  }
  transferList(){
    this.router.navigate(['stock-transfer-list']);
  }
}
