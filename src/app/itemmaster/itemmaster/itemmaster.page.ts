import {
  Component,
  OnInit,
  ElementRef,
  AfterViewInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { ProductService } from '../product.service';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import * as XLSX from 'xlsx';
import { SegmentService } from 'src/app/segment/segment.service';
import { ReferenceListService } from 'src/app/reference-list/reference-list.service';
import { AlertController } from '@ionic/angular';
@Component({
  selector: 'app-itemmaster',
  templateUrl: './itemmaster.page.html',
  styleUrls: ['./itemmaster.page.scss'],
})
export class ItemmasterPage implements OnInit {
  // @ViewChild("myinput") myInputField: ElementRef;
  @ViewChild('myInput', { static: false, read: ElementRef })
  myInputField: ElementRef<HTMLInputElement>;
  productForm = this.formBuilder.group({
    productId: [], ///
    refOrgId: [null], ///
    createdDate: [new Date()], ///
    refCreatedBy: [null], ///
    modifiedDate: [new Date()], ///
    refModifiedBy: [null], ///
    isActive: [true], ///
    isDeleted: [false], ///
    date: [''], ///
    productName: ['', [Validators.required]], ///
    // category: ['', [Validators.required]], //
    // subCategory: ['', [Validators.required]], //
    printName: ['', [Validators.required]], ///
    rfidcode: [null], ///
    itemCode: ['', [Validators.required]], ///
    barCode: ['', [Validators.required]], ///
    eancode: ['', [Validators.required]], ///
    hsnsaccode: ['', [Validators.required]], ///
    // brand: ['', [Validators.required]], //
    // type: ['', [Validators.required]], //
    // style: ['', [Validators.required]], //
    // pattern: ['', [Validators.required]], //
    // size: ['', [Validators.required]], //
    rack: ['', [Validators.required]], ///
    manufactureDate: [''], ///
    expiryDate: [''], ///
    itemWeight: [], ///
    gst: [], ///
    discount: [], ///
    quantity: [[Validators.required]], ///
    costRate: [[Validators.required]], ///
    salesRate: [[Validators.required]], ///
    mrp: [[Validators.required]], ///
    amount: [[Validators.required]], ///
    description: [''], ///
    refLocationId: [null], ///
    refRefListUomid: [null], ///
    openingQty: [], ///
    closingQty: [], ///
    segmentName: [''],
    0: [''],
    1: [''],
    2: [''],
    3: [''],
    4: [''],
    5: [''],
    6: [''],
    7: [''],
    8: [''],
    9: [''],
    10: [''],
    11: [''],
    12: [''],
    13: [''],
    14: [''],
    15: [''],
    16: [''],
    17: [''],
    18: [''],
    19: [''],
    20: [''],
  });
  productId: any;
  excelUpload: boolean;
  excelData: never[];
  segments: any = [];
  segmentList: any = [];
  segmentTemp: any;
  selectedSegment: any = [];
  productSegmentList: any = [];
  uom: any = [];
  seg: any;

  dynamicValues: any[] = [];
  byteLength: number;
  constructor(
    private formBuilder: FormBuilder,
    private product: ProductService,
    private route: ActivatedRoute,
    private datePipe: DatePipe,
    private router: Router,
    private segment: SegmentService,
    private refList: ReferenceListService,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    const id = this.route.params.subscribe((param) => {
      // this.editRateId = Number(param.id);
      this.productId = Number(param['id']);
      console.log(this.productId);
      if (this.productId) {
        this.getProduct();
        // this.getProduct1();
        // this.productRefListMapping();
      }
    });
    this.getSegments();
    this.getUoM();
  }
  clear() {
    this.productForm.controls.rfidcode.setValue(null);
  }
  getSegments() {
    this.segment.getSegment().subscribe((res: any) => {
      console.log(res);
      this.segments = res;
    });
  }
  getSegmentRef() {
    console.log(this.productForm.value.segmentName);
    this.segmentTemp = [];
    this.segmentList = [];
    this.segment
      .segmentRefList(this.productForm.value.segmentName)
      .subscribe((res: any) => {
        console.log(res);
        this.segmentTemp = res;
        let referenceName = [
          ...new Set(this.segmentTemp.map((p: any) => p.referenceName)),
        ];
        console.log(referenceName);
        this.segmentList = [];
        referenceName.forEach((element: any) => {
          let referenceNameList = this.segmentTemp.filter(
            (p: any) => p.referenceName === element
          );
          this.segmentList.push({ element, list: referenceNameList });
          console.log(this.segmentList);
          if (this.productId) {
            this.segmentList.forEach((item: any, index: any) => {
              this.productSegmentList.forEach((element: any, index: any) => {
                // console.log(item);
                // console.log(element);
                if (item.element === element.referenceame) {
                  // console.log(element.referenceListId);
                  // this.item+`${index}`=
                  this.dynamicValues[index] = element.referenceListId;
                  console.log(this.dynamicValues);
                }
              });
            });
          }
        });
      });
  }
  getSegmentRefupload(element: any) {
    const data = element;
    console.log(this.productForm.value.segmentName);
    this.segmentTemp = [];
    this.segmentList = [];
    this.segment
      .segmentRefList(this.productForm.value.segmentName)
      .subscribe((res: any) => {
        console.log(res);
        this.segmentTemp = res;
        let referenceName = [
          ...new Set(this.segmentTemp.map((p: any) => p.referenceName)),
        ];
        console.log(referenceName);
        this.segmentList = [];
        referenceName.forEach((element: any) => {
          let referenceNameList = this.segmentTemp.filter(
            (p: any) => p.referenceName === element
          );
          this.segmentList.push({ element, list: referenceNameList });
          if (this.productId) {
            this.segmentList.forEach((item: any, index: any) => {
              this.productSegmentList.forEach((element: any, index: any) => {
                // console.log(item);
                // console.log(element);
                if (item.element === element.referenceame) {
                  // console.log(element.referenceListId);
                  // this.item+`${index}`=
                  this.dynamicValues[index] = element.referenceListId;
                  console.log(this.dynamicValues);
                }
              });
            });
          }
        });
        console.log(this.segmentList);
        this.addSegmentListupload(data);
        setTimeout(()=> console.log('waiting'), 20000);
      });
  }
  addSegmentList(refList: any, ref: any) {
    console.log(refList.target.value, ref);
    if (this.productId) {
      this.productSegmentList.forEach((element: any) => {
        console.log(element);
        if (element.referenceame === ref) {
          let id = element.productEntryReferenceListMappingId;

          if (this.selectedSegment.length !== 0) {
            this.selectedSegment.forEach((element: any, index: number) => {
              console.log(element);
              if (element.ref === ref) {
                this.selectedSegment.splice(index, 1);
                // this.selectedSegment.push({
                //   ref: ref,
                //   refList: refList.target.value,
                // });
              }
            });
            this.selectedSegment.push({
              id: id,
              ref: ref,
              refList: refList.target.value,
            });
          } else {
            this.selectedSegment.push({
              id: id,
              ref: ref,
              refList: refList.target.value,
            });
          }
        }
      });
    } else {
      if (this.selectedSegment.length !== 0) {
        this.selectedSegment.forEach((element: any, index: number) => {
          console.log(element);
          if (element.ref === ref) {
            this.selectedSegment.splice(index, 1);
            // this.selectedSegment.push({
            //   ref: ref,
            //   refList: refList.target.value,
            // });
          }
        });
        this.selectedSegment.push({
          ref: ref,
          refList: refList.target.value,
        });
      } else {
        this.selectedSegment.push({
          ref: ref,
          refList: refList.target.value,
        });
      }
    }
    console.log(this.selectedSegment);
  }
  addSegmentListupload(refList: any) {
    console.log(refList);
    this.segmentList.forEach((element: any) => {
      console.log(element);
      element.list.forEach((items: any) => {
        console.log(items);
        if (
          refList.Color === items.referenceListName ||
          refList.Pattern === items.referenceListName ||
          refList.Size === items.referenceListName
        ) {
          // this.selectedSegment.push({
          //   refList: items.referenceListId,
          // });
          if (this.selectedSegment.length !== 0) {
            this.selectedSegment.forEach((element1: any, index: number) => {
              console.log(element1);
              if (items.refList === element1.ref) {
                this.selectedSegment.splice(index, 1);
                this.selectedSegment.push({
                  ref: items.referenceName,
                  refList:items.referenceListId,
                });
              }
            });
            this.selectedSegment.push({
              ref: items.referenceName,
              refList: items.referenceListId,
            });
          } else {
            this.selectedSegment.push({
              ref: items.referenceName,
              refList: items.referenceListId,
            });
          }
        }
      });
    });

    console.log(this.selectedSegment);
    // return;
    this.productForm.controls.productId.setValue(refList.productId);
      this.productForm.controls.amount.setValue(refList.Amount);
      this.productForm.controls.barCode.setValue(refList.Barcode);
      // this.productForm.controls.brand.setValue(refList.brand);
      // this.productForm.controls.category.setValue(refList.category);
      this.productForm.controls.closingQty.setValue(refList.Closing_Qty);
      this.productForm.controls.costRate.setValue(refList.Cost_Rate);
      // this.productForm.controls.createdDate.setValue(refList.createdDate);
      this.productForm.controls.date.setValue(
        this.datePipe.transform(refList.Date, 'yyyy-MM-dd')
      );
      this.productForm.controls.description.setValue(refList.Description);
      this.productForm.controls.discount.setValue(refList.Discount);
      this.productForm.controls.eancode.setValue(refList.EAN);
      this.productForm.controls.expiryDate.setValue(
        this.datePipe.transform(refList.Expiry_Date, 'yyyy-MM-dd')
      );
      this.productForm.controls.gst.setValue(refList.GST);
      this.productForm.controls.hsnsaccode.setValue(refList.HSNSAC_Code);
      // this.productForm.controls.isActive.setValue(refList.Item_Code);
      // this.productForm.controls.isDeleted.setValue(refList.isDeleted);
      this.productForm.controls.itemCode.setValue(String(refList.Item_Code));
      this.productForm.controls.mrp.setValue(refList.MRP);
      this.productForm.controls.itemWeight.setValue(refList.item_Weight);
      this.productForm.controls.manufactureDate.setValue(
        this.datePipe.transform(refList.Manufacture_Date, 'yyyy-MM-dd')
      );
      // this.productForm.controls.modifiedDate.setValue(refList.modifiedDate);
      // this.productForm.controls.mrp.setValue(refList.mrp);
      this.productForm.controls.openingQty.setValue(refList.Opening_Qty);
      // this.productForm.controls.pattern.setValue(String(refList.pattern));
      this.productForm.controls.printName.setValue(refList.Print_Name);
      this.productForm.controls.productName.setValue(refList.Name);
      this.productForm.controls.quantity.setValue(refList.Quantity);
      this.productForm.controls.rack.setValue(String(refList.Rack));
      this.productForm.controls.refCreatedBy.setValue(refList.refCreatedBy);
      this.productForm.controls.refLocationId.setValue(refList.refLocationId);
      this.productForm.controls.refModifiedBy.setValue(refList.refModifiedBy);
      this.productForm.controls.refOrgId.setValue(refList.refOrgId);
      this.productForm.controls.refRefListUomid.setValue(
        refList.UOM
      );
      this.productForm.controls.rfidcode.setValue(refList.RFID_Code);
      this.productForm.controls.salesRate.setValue(refList.Sales_Rate);
      // this.productForm.controls.size.setValue(refList.size);
      // this.productForm.controls.style.setValue(refList.style);
      // // this.productForm.controls.subCategory.setValue(refList.subCategory);
      // this.productForm.controls.type.setValue(refList.type);
      // this.productForm.controls.createdDate.setValue(new Date());
      // this.productForm.controls.isActive.setValue(true);
      // this.productForm.controls.isDeleted.setValue(false);
      // this.productForm.controls.modifiedDate.setValue(new Date());
      this.productForm.controls.refOrgId.setValue(null);
      this.productForm.controls.refModifiedBy.setValue(null);
      this.productForm.controls.refModifiedBy.setValue(null);
      this.productForm.controls.refLocationId.setValue(null);
      this.productForm.controls.refCreatedBy.setValue(null);
      console.log(this.productForm);
    this.addProduct();
  }
  addProduct() {
    console.log('Form:',this.productForm.value);
    console.log('Selected Segment:',this.selectedSegment);
    // return;
    if (this.productForm.valid) {
      if (this.productId) {
        const data = {
          productEntryId: this.productForm.value.productId,
          refOrgId: this.productForm.value.refOrgId,
          createdDate: this.productForm.value.createdDate,
          refCreatedBy: this.productForm.value.refCreatedBy,
          modifiedDate: new Date(),
          refModifiedBy: this.productForm.value.refModifiedBy,
          isActive: true,
          isDeleted: false,
          date: this.productForm.value.date,
          productName: this.productForm.value.productName, //
          // category: this.productForm.value.category,
          // subCategory: this.productForm.value.subCategory,
          printName: this.productForm.value.printName,
          rfidcode: this.productForm.value.rfidcode, //
          itemCode: this.productForm.value.itemCode,
          barCode: this.productForm.value.barCode, //
          eancode: this.productForm.value.eancode, //
          hsnsaccode: this.productForm.value.hsnsaccode,
          // brand: this.productForm.value.brand, //
          // type: this.productForm.value.type, //
          // style: this.productForm.value.style, //
          // pattern: this.productForm.value.pattern, //
          // size: this.productForm.value.size, //
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
        console.log(data);
        // return;
        this.product.updateProduct(data).subscribe((res: any) => {
          console.log(res);
          // window.location.reload();
          if (this.selectedSegment.length !== 0) {
            this.updateproductSegmentMapping();
          } else {
            this.router.navigate(['item-list']);
          }
        });
      } else {
        const data = {
          refOrgId: this.productForm.value.refOrgId,
          // createdDate: this.productForm.value.createdDate,
          refCreatedBy: this.productForm.value.refCreatedBy,
          // modifiedDate: this.productForm.value.modifiedDate,
          refModifiedBy: this.productForm.value.refModifiedBy,
          // isActive: this.productForm.value.isActive,
          // isDeleted: this.productForm.value.isDeleted,
          date: this.productForm.value.date,
          productName: this.productForm.value.productName, //
          // category: this.productForm.value.category,
          // subCategory: this.productForm.value.subCategory,
          printName: this.productForm.value.printName,
          rfidcode: this.productForm.value.rfidcode, //
          itemCode: this.productForm.value.itemCode,
          barCode: this.productForm.value.barCode, //
          eancode: this.productForm.value.eancode, //
          hsnsaccode: this.productForm.value.hsnsaccode,
          // brand: this.productForm.value.brand, //
          // type: this.productForm.value.type, //
          // style: this.productForm.value.style, //
          // pattern: this.productForm.value.pattern, //
          // size: this.productForm.value.size, //
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
          this.productForm.controls.productId.setValue(res.productEntryId);
          // window.location.reload();
          this.productSegmentMapping();
        });
      }
    } else {
      this.productForm.markAllAsTouched();
      console.log('Form not Valid', this.productForm);
    }
  }
  productSegmentMapping() {
    this.selectedSegment.forEach((element: any, index: any) => {
      const data = {
        refOrgid: this.productForm.value.refOrgId,
        refCreatedBy: this.productForm.value.refCreatedBy,
        refModifiedBy: this.productForm.value.refModifiedBy,
        refproductEntryId: this.productForm.value.productId,
        refReferenceListId: element.refList,
      };
      this.segment.productSegmentMapping(data).subscribe((res: any) => {
        console.log(res);
        if (index === this.selectedSegment.length - 1) {
          // Last iteration, reload the window
          // window.location.reload();
          this.router.navigate(['item-list']);
        }
      });
    });
  }
  updateproductSegmentMapping() {
    this.selectedSegment.forEach((element: any, index: any) => {
      if(element.id){

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
        this.segment.updatProductSegmentMapping(data).subscribe((res: any) => {
          console.log(res);
          if (index === this.selectedSegment.length - 1) {
            // Last iteration, reload the window
            // window.location.reload();
            this.router.navigate(['item-list']);
          }
        });
      }else{
        const data = {
          refOrgid: this.productForm.value.refOrgId,
          refCreatedBy: this.productForm.value.refCreatedBy,
          refModifiedBy: this.productForm.value.refModifiedBy,
          refproductEntryId: this.productForm.value.productId,
          refReferenceListId: element.refList,
        };
        this.segment.productSegmentMapping(data).subscribe((res: any) => {
          console.log(res);
          if (index === this.selectedSegment.length - 1) {
            // Last iteration, reload the window
            this.router.navigate(['item-list']);
          // window.location.reload();
        }
      });
      }
    });
  }
  productRefListMapping() {
    const data = {
      productId: this.productId,
    };
    this.segment.productRefListMapping(data).subscribe((res: any) => {
      console.log(res);
    });
  }
  getProduct1(){
    const data = {
      barcode: this.productId,
      rfidcode: null,
    };
    this.product.searchProduct(data).subscribe(async (res: any) => {
      console.log(res);
      // this.products=res[0];
      // this.salesForm.controls.productName.setValue(res[0].productName);
      // this.salesForm.controls.productEntryId.setValue(res[0].productEntryId);
      // this.salesForm.controls.printName.setValue(res[0].printName);
      // this.salesForm.controls.brand.setValue(res[0].brand);
      // this.salesForm.controls.category.setValue(res[0].category);
      // this.salesForm.controls.mrp.setValue(res[0].mrp);
      // this.salesForm.controls.saleRate.setValue(res[0].salesRate);

    });
  }
  getProduct() {
    console.log(this.productId);
    this.product.getProductbyBarcode(this.productId).subscribe((res: any) => {
      console.log(res);
      if (res.productEntry.length !== 0) {
        this.productForm.controls.productId.setValue(
          res.productEntry[0].productEntryId
        );
        this.productForm.controls.amount.setValue(res.productEntry[0].amount);
        this.productForm.controls.barCode.setValue(res.productEntry[0].barCode);
        // this.productForm.controls.brand.setValue(res.productEntry[0].brand);
        // this.productForm.controls.category.setValue(res.productEntry[0].category);
        this.productForm.controls.closingQty.setValue(
          res.productEntry[0].closingQty
        );
        this.productForm.controls.costRate.setValue(
          res.productEntry[0].costRate
        );
        this.productForm.controls.createdDate.setValue(
          res.productEntry[0].createdDate
        );
        this.productForm.controls.date.setValue(
          this.datePipe.transform(res.productEntry[0].date, 'yyyy-MM-dd')
        );
        this.productForm.controls.description.setValue(
          res.productEntry[0].description
        );
        this.productForm.controls.discount.setValue(
          res.productEntry[0].discount
        );
        this.productForm.controls.eancode.setValue(res.productEntry[0].eancode);
        this.productForm.controls.expiryDate.setValue(
          this.datePipe.transform(res.productEntry[0].expiryDate, 'yyyy-MM-dd')
        );
        this.productForm.controls.gst.setValue(res.productEntry[0].gst);
        this.productForm.controls.hsnsaccode.setValue(
          res.productEntry[0].eancode
        );
        this.productForm.controls.isActive.setValue(
          res.productEntry[0].isActive
        );
        this.productForm.controls.isDeleted.setValue(
          res.productEntry[0].isDeleted
        );
        this.productForm.controls.itemCode.setValue(
          res.productEntry[0].itemCode
        );
        this.productForm.controls.itemWeight.setValue(
          res.productEntry[0].itemWeight
        );
        this.productForm.controls.manufactureDate.setValue(
          this.datePipe.transform(
            res.productEntry[0].manufactureDate,
            'yyyy-MM-dd'
          )
        );
        this.productForm.controls.modifiedDate.setValue(
          res.productEntry[0].modifiedDate
        );
        this.productForm.controls.mrp.setValue(res.productEntry[0].mrp);
        this.productForm.controls.openingQty.setValue(
          res.productEntry[0].openingQty
        );
        // this.productForm.controls.pattern.setValue(res.productEntry[0].pattern);
        this.productForm.controls.printName.setValue(
          res.productEntry[0].printName
        );
        this.productForm.controls.productName.setValue(
          res.productEntry[0].productName
        );
        this.productForm.controls.quantity.setValue(
          res.productEntry[0].quantity
        );
        this.productForm.controls.rack.setValue(res.productEntry[0].rack);
        this.productForm.controls.refCreatedBy.setValue(
          res.productEntry[0].refCreatedBy
        );
        this.productForm.controls.refLocationId.setValue(
          res.productEntry[0].refLocationId
        );
        this.productForm.controls.refModifiedBy.setValue(
          res.productEntry[0].refModifiedBy
        );
        this.productForm.controls.refOrgId.setValue(
          res.productEntry[0].refOrgId
        );
        this.productForm.controls.refRefListUomid.setValue(
          res.productEntry[0].refRefListUomid
        );
        this.productForm.controls.rfidcode.setValue(
          res.productEntry[0].rfidcode
        );
        this.productForm.controls.salesRate.setValue(
          res.productEntry[0].salesRate
        );
        // this.productForm.controls.size.setValue(res.productEntry[0].size);
        // this.productForm.controls.style.setValue(res.productEntry[0].style);
        // this.productForm.controls.subCategory.setValue(res.productEntry[0].subCategory);
        // this.productForm.controls.type.setValue(res.productEntry[0].type);
        this.productForm.controls.segmentName.setValue(
          res.productCatSeg[0].segmentName
        );
        this.productSegmentList = res.productCatSeg;
        this.getSegmentRef();
      }
    });
  }
  excelUploadEnable() {
    this.excelUpload = !this.excelUpload ? true : false;
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
      // console.log(element);
      this.productForm.controls.segmentName.setValue(element.Segment);

      // this.productForm.controls.productId.setValue(element.productId);
      // this.productForm.controls.amount.setValue(element.Amount);
      // this.productForm.controls.barCode.setValue(element.Barcode);
      // // this.productForm.controls.brand.setValue(element.brand);
      // // this.productForm.controls.category.setValue(element.category);
      // this.productForm.controls.closingQty.setValue(element.Closing_Qty);
      // this.productForm.controls.costRate.setValue(element.Cost_Rate);
      // // this.productForm.controls.createdDate.setValue(element.createdDate);
      // this.productForm.controls.date.setValue(
      //   this.datePipe.transform(element.Date, 'yyyy-MM-dd')
      // );
      // this.productForm.controls.description.setValue(element.Description);
      // this.productForm.controls.discount.setValue(element.Discount);
      // this.productForm.controls.eancode.setValue(element.EAN);
      // this.productForm.controls.expiryDate.setValue(
      //   this.datePipe.transform(element.Expiry_Date, 'yyyy-MM-dd')
      // );
      // this.productForm.controls.gst.setValue(element.GST);
      // this.productForm.controls.hsnsaccode.setValue(element.HSNSAC_Code);
      // // this.productForm.controls.isActive.setValue(element.Item_Code);
      // // this.productForm.controls.isDeleted.setValue(element.isDeleted);
      // this.productForm.controls.itemCode.setValue(String(element.Item_Code));
      // this.productForm.controls.mrp.setValue(element.MRP);
      // this.productForm.controls.itemWeight.setValue(element.item_Weight);
      // this.productForm.controls.manufactureDate.setValue(
      //   this.datePipe.transform(element.Manufacture_Date, 'yyyy-MM-dd')
      // );
      // // this.productForm.controls.modifiedDate.setValue(element.modifiedDate);
      // // this.productForm.controls.mrp.setValue(element.mrp);
      // this.productForm.controls.openingQty.setValue(element.Opening_Qty);
      // // this.productForm.controls.pattern.setValue(String(element.pattern));
      // this.productForm.controls.printName.setValue(element.Print_Name);
      // this.productForm.controls.productName.setValue(element.Name);
      // this.productForm.controls.quantity.setValue(element.Quantity);
      // this.productForm.controls.rack.setValue(String(element.Rack));
      // this.productForm.controls.refCreatedBy.setValue(element.refCreatedBy);
      // this.productForm.controls.refLocationId.setValue(element.refLocationId);
      // this.productForm.controls.refModifiedBy.setValue(element.refModifiedBy);
      // this.productForm.controls.refOrgId.setValue(element.refOrgId);
      // this.productForm.controls.refRefListUomid.setValue(
      //   element.refRefListUomid
      // );
      // this.productForm.controls.rfidcode.setValue(element.RFID_Code);
      // this.productForm.controls.salesRate.setValue(element.Sales_Rate);
      // // this.productForm.controls.size.setValue(element.size);
      // // this.productForm.controls.style.setValue(element.style);
      // // // this.productForm.controls.subCategory.setValue(element.subCategory);
      // // this.productForm.controls.type.setValue(element.type);
      // // this.productForm.controls.createdDate.setValue(new Date());
      // // this.productForm.controls.isActive.setValue(true);
      // // this.productForm.controls.isDeleted.setValue(false);
      // // this.productForm.controls.modifiedDate.setValue(new Date());
      // this.productForm.controls.refOrgId.setValue(null);
      // this.productForm.controls.refModifiedBy.setValue(null);
      // this.productForm.controls.refModifiedBy.setValue(null);
      // this.productForm.controls.refLocationId.setValue(null);
      // this.productForm.controls.refCreatedBy.setValue(null);
      // console.log(this.productForm);
      this.getSegmentRefupload(element);

      // this.addProduct();
      // this.addSegmentListupload(element);
    });
  }
  clearRfid() {
    this.productForm.controls.rfidcode.setValue(null);
  }
  getUoM() {
    this.refList.getReferenceListbyRefName('UOM').subscribe((res: any) => {
      console.log(res);
      this.uom = res;
    });
  }
  async calculateByteLength(event: any) {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(event.target.value);
    this.byteLength = encodedData.length;
    console.log('byteLength', this.byteLength);
    if (this.byteLength === 48 && this.productId) {
      const alert = await this.alertController.create({
        header: 'Save',
        message: 'Do you want Update Product ',
        buttons: [
          {
            text: 'Edit',
            role: 'cancel',
          },
          {
            text: 'Save',
            handler: () => {
              this.addProduct();
            },
          },
        ],
      });

      await alert.present();
    }
  }
}
