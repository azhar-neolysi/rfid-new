import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  Validators,
} from '@angular/forms';
import { ProductService } from '../product.service';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import * as XLSX from 'xlsx';
import { SegmentService } from 'src/app/segment/segment.service';
import { ReferenceListService } from 'src/app/reference-list/reference-list.service';
import { AlertController } from '@ionic/angular';
import { ToastrService } from 'src/app/services/toastr/toastr.service';
import { ProductEntry } from 'src/app/models/product-entry.model';

@Component({
  selector: 'app-itemmaster',
  templateUrl: './itemmaster.page.html',
  styleUrls: ['./itemmaster.page.scss'],
})
export class ItemmasterPage implements OnInit {
  @ViewChild('myInput', { static: false, read: ElementRef })
  myInputField: ElementRef<HTMLInputElement>;

  productForm = this.formBuilder.group({
    productId: [],
    refOrgId: [null],
    createdDate: [new Date()],
    refCreatedBy: [null],
    modifiedDate: [new Date()],
    refModifiedBy: [null],
    isActive: [true],
    isDeleted: [false],
    date: [''],
    productName: ['', [Validators.required]],
    printName: ['', [Validators.required]],
    rfidcode: [null],
    itemCode: ['', [Validators.required]],
    barCode: ['', [Validators.required]],
    eancode: ['', [Validators.required]],
    hsnsaccode: ['', [Validators.required]],
    rack: ['', [Validators.required]],
    manufactureDate: [''],
    expiryDate: [''],
    itemWeight: [''],
    gst: [''],
    discount: [''],
    quantity: ['', [Validators.required]],
    costRate: ['', [Validators.required]],
    salesRate: ['', [Validators.required]],
    mrp: ['', [Validators.required]],
    amount: ['', [Validators.required]],
    description: [''],
    refLocationId: [null],
    refRefListUomid: [null],
    openingQty: [''],
    closingQty: [''],
    segmentName: [''],
    mcDesc: [''],
    styleCode: [''],
    uploadType: [''],
    0: [''], 1: [''], 2: [''], 3: [''], 4: [''],
    5: [''], 6: [''], 7: [''], 8: [''], 9: [''],
    10: [''], 11: [''], 12: [''], 13: [''], 14: [''],
    15: [''], 16: [''], 17: [''], 18: [''], 19: [''], 20: [''],
  });

  productId: number;
  excelUpload = false;
  excelData: any[];
  segments: any[] = [];
  segmentList: any[] = [];
  segmentTemp: any[];
  selectedSegment: any[] = [];
  productSegmentList: any[] = [];
  uom: any[] = [];
  dynamicValues: any[] = [];
  byteLength: number;
  maxDate: string;
  groupedData: any;
  groupedData2: any[] = [];
  excelDataRaw: any[];

  constructor(
    private formBuilder: FormBuilder,
    private product: ProductService,
    private route: ActivatedRoute,
    private datePipe: DatePipe,
    private router: Router,
    private segment: SegmentService,
    private refList: ReferenceListService,
    private alertController: AlertController,
    private toast: ToastrService
  ) {
    this.maxDate = new Date().toISOString().split('T')[0];
    this.productForm.controls.date.setValue(this.maxDate);
    this.productForm.controls.expiryDate.setValue(this.maxDate);
    this.productForm.controls.manufactureDate.setValue(this.maxDate);
  }

  ngOnInit() {
    this.route.params.subscribe((param) => {
      this.productId = Number(param['id']);
      if (this.productId) {
        this.getProduct();
      }
    });
    this.getSegments();
    this.getUoM();
  }

  clear() {
    this.productForm.controls.rfidcode.setValue(null);
  }

  clearRfid() {
    this.productForm.controls.rfidcode.setValue(null);
  }

  getSegments() {
    this.segment.getSegment().subscribe((res: any[]) => {
      this.segments = res;
    });
  }

  getUoM() {
    this.refList.getReferenceListbyRefName('UOM').subscribe((res: any[]) => {
      this.uom = res;
    });
  }

  getSegmentRef() {
    this.segmentTemp = [];
    this.segmentList = [];
    this.segment
      .segmentRefList(this.productForm.value.segmentName as string)
      .subscribe((res: any[]) => {
        this.segmentTemp = res;
        const referenceName = [...new Set(this.segmentTemp.map((p: any) => p.referenceName))];
        this.segmentList = [];
        referenceName.forEach((element: any) => {
          const referenceNameList = this.segmentTemp.filter((p: any) => p.referenceName === element);
          this.segmentList.push({ element, list: referenceNameList });
          if (this.productId) {
            this.segmentList.forEach((item: any, index: number) => {
              this.productSegmentList.forEach((el: any) => {
                if (item.element === el.referenceame) {
                  this.dynamicValues[index] = el.referenceListId;
                }
              });
            });
          }
        });
      });
  }

  addSegmentList(refList: any, ref: any) {
    const existing = this.selectedSegment.findIndex((s) => s.ref === ref);
    if (existing !== -1) {
      this.selectedSegment.splice(existing, 1);
    }
    const newEntry: any = { ref, refList: refList.target.value };
    if (this.productId) {
      const existingMapping = this.productSegmentList.find((el: any) => el.referenceame === ref);
      if (existingMapping) {
        newEntry.id = existingMapping.productEntryReferenceListMappingId;
      }
    }
    this.selectedSegment.push(newEntry);
  }

  addSegmentListupload(refList: any) {
    this.segmentList.forEach((element: any) => {
      element.list.forEach((items: any) => {
        if (
          refList.Color === items.referenceListName ||
          refList.Pattern === items.referenceListName ||
          refList.Size === items.referenceListName
        ) {
          const existing = this.selectedSegment.findIndex((s) => s.ref === items.referenceName);
          if (existing !== -1) {
            this.selectedSegment.splice(existing, 1);
          }
          this.selectedSegment.push({
            ref: items.referenceName,
            refList: items.referenceListId,
          });
        }
      });
    });

    this.populateFormFromExcel(refList);
    this.addProduct();
  }

  addProduct() {
    if (this.productForm.valid) {
      if (this.productId) {
        this.updateProduct();
      } else {
        this.createProduct();
      }
    } else {
      this.showValidationErrors();
    }
  }

  private createProduct() {
    const data = this.buildProductData();
    this.product.addProduct(data as any).subscribe((res: any) => {
      this.productForm.controls.productId.setValue(res.productEntryId);
      this.saveSegmentMappings();
    });
  }

  private updateProduct() {
    if (!this.productForm.value.rfidcode) {
      this.toast.danger('Enter RFID Code');
      return;
    }
    const data = {
      ...this.buildProductData(),
      productEntryId: this.productForm.value.productId,
      modifiedDate: new Date(),
    };
    this.product.updateProduct(data as any).subscribe(() => {
      if (this.selectedSegment.length !== 0) {
        this.updateproductSegmentMapping();
      } else {
        this.toast.success('Record Saved Successfully');
        setTimeout(() => this.router.navigate(['item-list']), 3000);
      }
    });
  }

  private buildProductData(): Partial<ProductEntry> {
    return {
      refOrgId: this.productForm.value.refOrgId,
      refCreatedBy: this.productForm.value.refCreatedBy,
      refModifiedBy: this.productForm.value.refModifiedBy,
      date: this.productForm.value.date,
      productName: this.productForm.value.productName,
      printName: this.productForm.value.printName,
      rfidcode: this.productForm.value.rfidcode,
      itemCode: this.productForm.value.itemCode,
      barCode: this.productForm.value.barCode,
      eancode: this.productForm.value.eancode,
      hsnsaccode: this.productForm.value.hsnsaccode,
      rack: this.productForm.value.rack,
      manufactureDate: this.productForm.value.manufactureDate,
      expiryDate: this.productForm.value.expiryDate,
      itemWeight: this.productForm.value.itemWeight,
      gst: this.productForm.value.gst,
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
      mcDesc: this.productForm.value.mcDesc,
      styleCode: this.productForm.value.styleCode,
      isActive: 'true',
      isDeleted: 'false',
      description1: '0',
      description2: '0',
      description3: '',
      description4: '',
      description5: '',
      description6: '',
      description7: '',
      description8: '',
      description9: '',
      description10: '',
    };
  }

  private showValidationErrors() {
    const fields = [
      { key: 'productName', label: 'Product Name' },
      { key: 'printName', label: 'Product Print Name' },
      { key: 'itemCode', label: 'Item Code' },
      { key: 'barCode', label: 'Barcode' },
      { key: 'hsnsaccode', label: 'Hsnsac Code' },
      { key: 'eancode', label: 'EAN Code' },
      { key: 'rack', label: 'Rack' },
      { key: 'quantity', label: 'Quantity' },
      { key: 'costRate', label: 'Cost Rate' },
      { key: 'salesRate', label: 'Sales Rate' },
      { key: 'mrp', label: 'MRP' },
      { key: 'amount', label: 'Product Amount' },
    ];
    for (const field of fields) {
      if (!(this.productForm.value as any)[field.key]) {
        this.toast.danger(`Enter ${field.label}`);
        return;
      }
    }
  }

  saveSegmentMappings() {
    this.selectedSegment.forEach((element: any, index: number) => {
      const data = {
        refOrgid: this.productForm.value.refOrgId,
        refCreatedBy: this.productForm.value.refCreatedBy,
        refModifiedBy: this.productForm.value.refModifiedBy,
        refproductEntryId: this.productForm.value.productId,
        refReferenceListId: element.refList,
      };
      this.segment.productSegmentMapping(data).subscribe(() => {
        if (index === this.selectedSegment.length - 1) {
          this.toast.success('Record Saved Successfully');
        }
      });
    });
  }

  updateproductSegmentMapping() {
    this.selectedSegment.forEach((element: any, index: number) => {
      if (element.id) {
        const data = {
          refOrgid: this.productForm.value.refOrgId,
          refCreatedBy: this.productForm.value.refCreatedBy,
          refModifiedBy: this.productForm.value.refModifiedBy,
          refproductEntryId: this.productForm.value.productId,
          refReferenceListId: element.refList,
          productEntryReferenceListMappingId: element.id,
          isActive: true,
          createdDate: this.productForm.value.refCreatedBy,
          modifiedDate: new Date(),
          isDeleted: false,
        };
        this.segment.updatProductSegmentMapping(data).subscribe(() => {
          if (index === this.selectedSegment.length - 1) {
            this.toast.success('Record Saved Successfully');
            setTimeout(() => this.router.navigate(['item-list']), 3000);
          }
        });
      } else {
        const data = {
          refOrgid: this.productForm.value.refOrgId,
          refCreatedBy: this.productForm.value.refCreatedBy,
          refModifiedBy: this.productForm.value.refModifiedBy,
          refproductEntryId: this.productForm.value.productId,
          refReferenceListId: element.refList,
        };
        this.segment.productSegmentMapping(data).subscribe(() => {
          if (index === this.selectedSegment.length - 1) {
            setTimeout(() => this.router.navigate(['item-list']), 3000);
          }
        });
      }
    });
  }

  getProduct() {
    this.product.getProductbyBarcode(String(this.productId)).subscribe((res: any) => {
      if (res.productEntry.length !== 0) {
        const p = res.productEntry[0];
        this.populateFormFromProduct(p);
        this.productForm.controls.segmentName.setValue(res.productCatSeg[0].segmentName);
        this.productSegmentList = res.productCatSeg;
        this.getSegmentRef();
      }
    });
  }

  private populateFormFromProduct(p: any) {
    this.productForm.controls.productId.setValue(p.productEntryId);
    this.productForm.controls.amount.setValue(p.amount);
    this.productForm.controls.barCode.setValue(p.barCode);
    this.productForm.controls.closingQty.setValue(p.closingQty);
    this.productForm.controls.costRate.setValue(p.costRate);
    this.productForm.controls.createdDate.setValue(p.createdDate);
    this.productForm.controls.date.setValue(this.datePipe.transform(p.date, 'yyyy-MM-dd'));
    this.productForm.controls.description.setValue(p.description);
    this.productForm.controls.discount.setValue(p.discount);
    this.productForm.controls.eancode.setValue(p.eancode);
    this.productForm.controls.expiryDate.setValue(this.datePipe.transform(p.expiryDate, 'yyyy-MM-dd'));
    this.productForm.controls.gst.setValue(p.gst);
    this.productForm.controls.hsnsaccode.setValue(p.hsnsaccode);
    this.productForm.controls.isActive.setValue(p.isActive);
    this.productForm.controls.isDeleted.setValue(p.isDeleted);
    this.productForm.controls.itemCode.setValue(p.itemCode);
    this.productForm.controls.itemWeight.setValue(p.itemWeight);
    this.productForm.controls.manufactureDate.setValue(this.datePipe.transform(p.manufactureDate, 'yyyy-MM-dd'));
    this.productForm.controls.modifiedDate.setValue(p.modifiedDate);
    this.productForm.controls.mrp.setValue(p.mrp);
    this.productForm.controls.openingQty.setValue(p.openingQty);
    this.productForm.controls.printName.setValue(p.printName);
    this.productForm.controls.productName.setValue(p.productName);
    this.productForm.controls.quantity.setValue(p.quantity);
    this.productForm.controls.rack.setValue(p.rack);
    this.productForm.controls.refCreatedBy.setValue(p.refCreatedBy);
    this.productForm.controls.refLocationId.setValue(p.refLocationId);
    this.productForm.controls.refModifiedBy.setValue(p.refModifiedBy);
    this.productForm.controls.refOrgId.setValue(p.refOrgId);
    this.productForm.controls.refRefListUomid.setValue(p.refRefListUomid);
    this.productForm.controls.rfidcode.setValue(p.rfidcode);
    this.productForm.controls.salesRate.setValue(p.salesRate);
  }

  private populateFormFromExcel(refList: any) {
    this.productForm.controls.productId.setValue(refList.productId);
    this.productForm.controls.amount.setValue(refList.Amount);
    this.productForm.controls.barCode.setValue(refList.Barcode);
    this.productForm.controls.closingQty.setValue(refList.Closing_Qty);
    this.productForm.controls.costRate.setValue(refList.Cost_Rate);
    this.productForm.controls.date.setValue(this.datePipe.transform(refList.Date, 'yyyy-MM-dd'));
    this.productForm.controls.description.setValue(refList.Description);
    this.productForm.controls.discount.setValue(refList.Discount);
    this.productForm.controls.eancode.setValue(refList.EAN);
    this.productForm.controls.expiryDate.setValue(this.datePipe.transform(refList.Expiry_Date, 'yyyy-MM-dd'));
    this.productForm.controls.gst.setValue(refList.GST);
    this.productForm.controls.hsnsaccode.setValue(refList.HSNSAC_Code);
    this.productForm.controls.itemCode.setValue(String(refList.Item_Code));
    this.productForm.controls.mrp.setValue(refList.MRP);
    this.productForm.controls.itemWeight.setValue(refList.item_Weight);
    this.productForm.controls.manufactureDate.setValue(this.datePipe.transform(refList.Manufacture_Date, 'yyyy-MM-dd'));
    this.productForm.controls.openingQty.setValue(refList.Opening_Qty);
    this.productForm.controls.printName.setValue(refList.Print_Name);
    this.productForm.controls.productName.setValue(refList.Name);
    this.productForm.controls.quantity.setValue(refList.Quantity);
    this.productForm.controls.rack.setValue(String(refList.Rack));
    this.productForm.controls.refCreatedBy.setValue(null);
    this.productForm.controls.refLocationId.setValue(null);
    this.productForm.controls.refModifiedBy.setValue(null);
    this.productForm.controls.refOrgId.setValue(null);
    this.productForm.controls.refRefListUomid.setValue(refList.UOM);
    this.productForm.controls.rfidcode.setValue(refList.RFID_Code);
    this.productForm.controls.salesRate.setValue(refList.Sales_Rate);
  }

  excelUploadEnable() {
    this.excelUpload = !this.excelUpload;
  }

  onFileSelected(event: any) {
    this.excelDataRaw = [];
    const file: any = event.target.files[0];
    const fileReader = new FileReader();
    fileReader.readAsBinaryString(file);
    fileReader.onload = () => {
      const workbook = XLSX.read(fileReader.result, { type: 'binary' });
      const sheetNames = workbook.SheetNames;
      this.excelDataRaw = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNames[0]]);

      if (this.productForm.value.uploadType === 'uan') {
        this.groupByEancode();
      } else {
        this.excelData = this.excelDataRaw;
      }
    };
  }

  private groupByEancode() {
    this.groupedData = {};
    this.excelDataRaw.forEach((item: any) => {
      const key = item.eancode.toString();
      if (!this.groupedData[key]) {
        this.groupedData[key] = [];
      }
      this.groupedData[key].push(item);
    });
    this.groupedData2 = [];
    for (const key in this.groupedData) {
      if (Object.prototype.hasOwnProperty.call(this.groupedData, key)) {
        const element = this.groupedData[key];
        element[0].quantity = element.length;
        this.groupedData2.push(element[0]);
      }
    }
    this.excelData = this.groupedData2;
  }

  upload() {
    this.excelData.forEach((productData: any) => {
      this.refList.getReferenceListbyName(productData.uom).subscribe((res0: any[]) => {
        this.productForm.controls.refRefListUomid.setValue(res0[0].referenceListId);
        this.refList.getReferenceListbyName(productData.color).subscribe((res1: any[]) => {
          this.selectedSegment.push({ ref: res1[0].referencename, refList: res1[0].referenceListId });
          this.refList.getReferenceListbyName(productData.size).subscribe((res2: any[]) => {
            this.selectedSegment.push({ ref: res2[0].referencename, refList: res2[0].referenceListId });
            this.refList.getReferenceListbyName(productData.pattern).subscribe((res3: any[]) => {
              this.selectedSegment.push({ ref: res3[0].referencename, refList: res3[0].referenceListId });
              this.populateFormFromExcelRow(productData);
              this.addProduct();
            });
          });
        });
      });
    });
  }

  private populateFormFromExcelRow(d: any) {
    this.productForm.controls.amount.setValue(d.amount);
    this.productForm.controls.barCode.setValue(String(d.barCode));
    this.productForm.controls.closingQty.setValue(d.closingQty);
    this.productForm.controls.costRate.setValue(d.costRate);
    this.productForm.controls.description.setValue(d.description);
    this.productForm.controls.discount.setValue(d.discount);
    this.productForm.controls.eancode.setValue(String(d.eancode));
    this.productForm.controls.expiryDate.setValue(this.datePipe.transform(d.expiryDate, 'yyyy-MM-dd'));
    this.productForm.controls.gst.setValue(d.gst);
    this.productForm.controls.hsnsaccode.setValue(String(d.hsnsaccode));
    this.productForm.controls.itemWeight.setValue(d.itemWeight);
    this.productForm.controls.itemCode.setValue(d.itemcode);
    this.productForm.controls.manufactureDate.setValue(this.datePipe.transform(d.manufactureDate, 'yyyy-MM-dd'));
    this.productForm.controls.mcDesc.setValue(d.mcdescription);
    this.productForm.controls.mrp.setValue(d.mrp);
    this.productForm.controls.openingQty.setValue(d.openingQty);
    this.productForm.controls.printName.setValue(d.printName);
    this.productForm.controls.productName.setValue(d.productName);
    this.productForm.controls.quantity.setValue(d.quantity);
    this.productForm.controls.rack.setValue(d.rack);
    this.productForm.controls.salesRate.setValue(d.salesRate);
    this.productForm.controls.styleCode.setValue(d.stylecode);
  }

  async calculateByteLength(event: any) {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(event.target.value);
    this.byteLength = encodedData.length;
    if (this.byteLength === 48 && this.productId) {
      const alert = await this.alertController.create({
        header: 'Save',
        message: 'Do you want Update Product',
        buttons: [
          { text: 'Edit', role: 'cancel' },
          { text: 'Save', handler: () => this.addProduct() },
        ],
      });
      await alert.present();
    }
  }
}
