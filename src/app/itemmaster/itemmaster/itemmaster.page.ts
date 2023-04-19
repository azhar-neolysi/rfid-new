import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { ProductService } from '../product.service';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
@Component({
  selector: 'app-itemmaster',
  templateUrl: './itemmaster.page.html',
  styleUrls: ['./itemmaster.page.scss'],
})
export class ItemmasterPage implements OnInit {
  productForm = this.formBuilder.group({
    productId: [],
    refOrgId: [null],
    createdDate: [new Date(), [Validators.required]],
    refCreatedBy: [null],
    modifiedDate: [new Date()],
    refModifiedBy: [null],
    isActive: [true],
    isDeleted: [false],
    date: [''], //
    productName: ['', [Validators.required]], //
    category: ['', [Validators.required]], //
    subCategory: ['', [Validators.required]], //
    printName: ['', [Validators.required]], //
    rfidcode: ['', [Validators.required]], //
    itemCode: ['', [Validators.required]], //
    barCode: ['', [Validators.required]], //
    eancode: ['', [Validators.required]], //
    hsnsaccode: ['', [Validators.required]], //
    brand: ['', [Validators.required]], //
    type: ['', [Validators.required]], //
    style: ['', [Validators.required]], //
    pattern: ['', [Validators.required]], //
    size: ['', [Validators.required]], //
    rack: ['', [Validators.required]], //
    manufactureDate: [''], //
    expiryDate: [''], //
    itemWeight: [], //
    gst: [], //
    discount: [], ///
    quantity: [[Validators.required]], //
    costRate: [[Validators.required]], //
    salesRate: [[Validators.required]], //
    mrp: [[Validators.required]], //
    amount: [[Validators.required]],
    description: [''], //
    refLocationId: [null],
    refRefListUomid: [null],
    openingQty: [], //
    closingQty: [], //
  });
  productId: any;

  constructor(
    private formBuilder: FormBuilder,
    private product: ProductService,
    private route: ActivatedRoute,
    private datePipe: DatePipe,
    private router: Router
  ) {}

  ngOnInit() {
    const id = this.route.params.subscribe((param) => {
      // this.editRateId = Number(param.id);
      this.productId = param['id'];
      console.log(this.productId);
      if (this.productId) {
        this.getProduct();
      }
    });
  }
  addProduct() {
    if (this.productForm.valid) {
      if (this.productId) {
        const data = {
          productMasterId: this.productForm.value.productId,
          refOrgId: this.productForm.value.refOrgId,
          createdDate: this.productForm.value.createdDate,
          refCreatedBy: this.productForm.value.refCreatedBy,
          modifiedDate: this.productForm.value.modifiedDate,
          refModifiedBy: this.productForm.value.refModifiedBy,
          isActive: this.productForm.value.isActive,
          isDeleted: this.productForm.value.isDeleted,
          date: this.productForm.value.date,
          productName: this.productForm.value.productName, //
          category: this.productForm.value.category,
          subCategory: this.productForm.value.subCategory,
          printName: this.productForm.value.printName,
          rfidcode: this.productForm.value.rfidcode, //
          itemCode: this.productForm.value.itemCode,
          barCode: this.productForm.value.barCode, //
          eancode: this.productForm.value.eancode, //
          hsnsaccode: this.productForm.value.hsnsaccode,
          brand: this.productForm.value.brand, //
          type: this.productForm.value.type, //
          style: this.productForm.value.style, //
          pattern: this.productForm.value.pattern, //
          size: this.productForm.value.size, //
          rack: this.productForm.value.rack, //
          manufactureDate: this.productForm.value.manufactureDate,
          expiryDate: this.productForm.value.expiryDate,
          itemWeight: this.productForm.value.itemWeight,
          gst: Number(this.productForm.value.gst),
          discount: this.productForm.value.discount,
          quantity: this.productForm.value.quantity,
          costRate: this.productForm.value.costRate,
          salesRate: this.productForm.value.salesRate,
          mrp: this.productForm.value.mrp,
          amount: this.productForm.value.amount,
          description: this.productForm.value.description,
          refLocationId: this.productForm.value.refLocationId,
          refRefListUomid: this.productForm.value.refRefListUomid,
          openingQty: this.productForm.value.openingQty,
          closingQty: this.productForm.value.closingQty,
        };
        console.log(this.productForm.value);
        this.product.updateProduct(data).subscribe((res: any) => {
          console.log(res);
          // window.location.reload();
          this.router.navigate(['item-list']);
        });
      } else {
        const data = {
          refOrgId: this.productForm.value.refOrgId,
          createdDate: this.productForm.value.createdDate,
          refCreatedBy: this.productForm.value.refCreatedBy,
          modifiedDate: this.productForm.value.modifiedDate,
          refModifiedBy: this.productForm.value.refModifiedBy,
          isActive: this.productForm.value.isActive,
          isDeleted: this.productForm.value.isDeleted,
          date: this.productForm.value.date,
          productName: this.productForm.value.productName, //
          category: this.productForm.value.category,
          subCategory: this.productForm.value.subCategory,
          printName: this.productForm.value.printName,
          rfidcode: this.productForm.value.rfidcode, //
          itemCode: this.productForm.value.itemCode,
          barCode: this.productForm.value.barCode, //
          eancode: this.productForm.value.eancode, //
          hsnsaccode: this.productForm.value.hsnsaccode,
          brand: this.productForm.value.brand, //
          type: this.productForm.value.type, //
          style: this.productForm.value.style, //
          pattern: this.productForm.value.pattern, //
          size: this.productForm.value.size, //
          rack: this.productForm.value.rack, //
          manufactureDate: this.productForm.value.manufactureDate,
          expiryDate: this.productForm.value.expiryDate,
          itemWeight: this.productForm.value.itemWeight,
          gst: Number(this.productForm.value.gst),
          discount: this.productForm.value.discount,
          quantity: this.productForm.value.quantity,
          costRate: this.productForm.value.costRate,
          salesRate: this.productForm.value.salesRate,
          mrp: this.productForm.value.mrp,
          amount: this.productForm.value.amount,
          description: this.productForm.value.description,
          refLocationId: this.productForm.value.refLocationId,
          refRefListUomid: this.productForm.value.refRefListUomid,
          openingQty: this.productForm.value.openingQty,
          closingQty: this.productForm.value.closingQty,
        };
        console.log(this.productForm.value);
        this.product.addProduct(data).subscribe((res: any) => {
          console.log(res);
          window.location.reload();
        });
      }
    } else {
      this.productForm.markAllAsTouched();
      console.log('Form not Valid', this.productForm);
    }
  }
  getProduct() {
    this.product.getProduct(this.productId).subscribe((res: any) => {
      console.log(res);

      this.productForm.controls.productId.setValue(res.productMasterId);
      this.productForm.controls.amount.setValue(res.amount);
      this.productForm.controls.barCode.setValue(res.barCode);
      this.productForm.controls.brand.setValue(res.brand);
      this.productForm.controls.category.setValue(res.category);
      this.productForm.controls.closingQty.setValue(res.closingQty);
      this.productForm.controls.costRate.setValue(res.costRate);
      this.productForm.controls.createdDate.setValue(res.createdDate);
      this.productForm.controls.date.setValue(
        this.datePipe.transform(res.date, 'yyyy-MM-dd')
      );
      this.productForm.controls.description.setValue(res.description);
      this.productForm.controls.discount.setValue(res.discount);
      this.productForm.controls.eancode.setValue(res.eancode);
      this.productForm.controls.expiryDate.setValue(
        this.datePipe.transform(res.expiryDate, 'yyyy-MM-dd')
      );
      this.productForm.controls.gst.setValue(res.gst);
      this.productForm.controls.hsnsaccode.setValue(res.eancode);
      this.productForm.controls.isActive.setValue(res.isActive);
      this.productForm.controls.isDeleted.setValue(res.isDeleted);
      this.productForm.controls.itemCode.setValue(res.itemCode);
      this.productForm.controls.itemWeight.setValue(res.itemWeight);
      this.productForm.controls.manufactureDate.setValue(
        this.datePipe.transform(res.manufactureDate, 'yyyy-MM-dd')
      );
      this.productForm.controls.modifiedDate.setValue(res.modifiedDate);
      this.productForm.controls.mrp.setValue(res.mrp);
      this.productForm.controls.openingQty.setValue(res.openingQty);
      this.productForm.controls.pattern.setValue(res.pattern);
      this.productForm.controls.printName.setValue(res.printName);
      this.productForm.controls.productName.setValue(res.productName);
      this.productForm.controls.quantity.setValue(res.quantity);
      this.productForm.controls.rack.setValue(res.rack);
      this.productForm.controls.refCreatedBy.setValue(res.refCreatedBy);
      this.productForm.controls.refLocationId.setValue(res.refLocationId);
      this.productForm.controls.refModifiedBy.setValue(res.refModifiedBy);
      this.productForm.controls.refOrgId.setValue(res.refOrgId);
      this.productForm.controls.refRefListUomid.setValue(res.refRefListUomid);
      this.productForm.controls.rfidcode.setValue(res.rfidcode);
      this.productForm.controls.salesRate.setValue(res.salesRate);
      this.productForm.controls.size.setValue(res.size);
      this.productForm.controls.style.setValue(res.style);
      this.productForm.controls.subCategory.setValue(res.subCategory);
      this.productForm.controls.type.setValue(res.type);
    });
  }
}
