import {
  Component,
  OnInit,
  ElementRef,
  AfterViewInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { Platform, AlertController, MenuController } from '@ionic/angular';
import * as XLSX from 'xlsx';
import { ProductService } from '../itemmaster/product.service';

@Component({
  selector: 'app-find-tag',
  templateUrl: './find-tag.page.html',
  styleUrls: ['./find-tag.page.scss'],
})
export class FindTagPage implements OnInit, AfterViewInit {
  // @ViewChild('inputTag', { static: false }) myInput: ElementRef;
  @ViewChild('myInput', { static: false, read: ElementRef })
  myInput: ElementRef<HTMLInputElement>;
  readerConnected = false;
  tagsArr: any = [];
  totalScannes: any = 0;
  totalTags: any = 0;
  scannedTags: any = [];
  tagsArrTemp: any = [];
  totalScannesTemp: any = 0;
  totalTagsTemp: any = 0;
  scannedTagsTemp: any = [];
  tags: any;
  excelUpload: boolean;
  foundArray: any[] = [];
  notFoundArray: any[] = [];
  notFoundBarcode: any[] = [];
  extraArray: any[] = [];
  excelUpload2: boolean;
  excelData: never[];
  constructor(
    public alertController: AlertController,
    private renderer: Renderer2,
    private product: ProductService
  ) {}
  ngOnInit() {}
  ngAfterViewInit() {
    this.renderer.selectRootElement(this.myInput.nativeElement).focus();
  }
  search(event: any) {
    console.log(event.detail.value);
    const parts = event.detail.value.split('\n');
    console.log(parts);
    // let arr:any=[];

    this.tagsArr = [];
    // this.tagsArr.push(parts);
    this.tagsArr = parts.filter((tag: any) => tag !== '');
    // this.tags='';
    this.totalScannes = this.tagsArr.length;
    console.log(this.tagsArr);
    console.log(this.totalScannes);
    this.scannedTags = this.tagsArr.filter(
      (value: any, index: any, self: string | any[]) => {
        return self.indexOf(value) === index;
      }
    );
    console.log(this.scannedTags);
    this.totalTags = this.scannedTags.length;
  }
  gettags(event: any) {
    console.log(event.detail.value);
    const parts = event.detail.value.split('\n');
    console.log(parts);

    this.tagsArr = [];
    parts.forEach((element: any) => {
      console.log(element);
      const data = {
        barcode: element,
        rfidcode: null,
      };
      this.product.searchProduct(data).subscribe((res: any) => {
        console.log(res);
        res.forEach((element: any) => {
          this.tagsArr.push(element.rfidcode);
          console.log(this.tagsArr);
        });
      });
    });
  }

  search2(event: any) {
    console.log(event.detail.value);
    const parts = event.detail.value.split('\n');
    console.log(parts);

    this.tagsArrTemp = [];
    this.tagsArrTemp = parts.filter((tag: any) => tag !== '');
    this.totalScannesTemp = this.tagsArrTemp.length;
    console.log(this.tagsArrTemp);
    console.log(this.totalScannesTemp);
    this.scannedTagsTemp = this.tagsArrTemp.filter(
      (value: any, index: any, self: string | any[]) => {
        return self.indexOf(value) === index;
      }
    );
    console.log(this.scannedTagsTemp);
    // this.scannedTagsTemp.forEach((element: any) => {
    //   console.log(this.tags);
    //   console.log(element);
    //   if (element === this.tags) {
    //     this.showExitConfirm();
    //   }
    // });
    this.foundArray = [];
    this.notFoundArray = [];
    this.extraArray = [];
    this.scannedTagsTemp.forEach((element: any) => {
      if (this.scannedTags.includes(element)) {
        this.foundArray.push(element);
      } else {
        this.extraArray.push(element);
      }
    });

    this.notFoundArray = this.scannedTags.filter(
      (element: any) => !this.scannedTagsTemp.includes(element)
    );

    console.log('Found Array:', this.foundArray);
    console.log('Not Found Array:', this.notFoundArray);
    console.log('Extra Array:', this.extraArray);
  }
  excelUploadEnable() {
    this.excelUpload = !this.excelUpload ? true : false;
  }
  excelUploadEnable2() {
    this.excelUpload2 = !this.excelUpload2 ? true : false;
    this.notFoundBarcode = [];
  }
  showExitConfirm() {
    this.alertController
      .create({
        header: 'RFID Tag Search',
        message: 'Tag Found',
        backdropDismiss: false,
        // mode:'ios',
        cssClass: 'custom-alert',
        buttons: [
          {
            text: 'Ok',
            role: 'cancel',
            cssClass: 'alert-button-cancel',
            handler: () => {
              console.log('Application exit prevented!');
            },
          },
        ],
      })
      .then((alert) => {
        alert.present();
      });
  }
  onFileSelected(event: any) {
    this.excelData = [];
    this.notFoundBarcode = [];
    const file: any = event.target.files[0];
    console.log(file);
    let fileReader = new FileReader();
    fileReader.readAsBinaryString(file);
    fileReader.onload = (e) => {
      var workbook = XLSX.read(fileReader.result, { type: 'binary' });
      var sheetNames = workbook.SheetNames;
      this.excelData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNames[0]]);
      console.log(this.excelData);
      this.excelData.forEach((item: any) => {
        const data = {
          barcode: item.tags,
          rfidcode: null,
        };
        this.product.searchProduct(data).subscribe((res: any) => {
          console.log(item.tags);
          console.log(res);
          console.log(this.scannedTags);
          if (res.length !== 0) {
            res.forEach((element: any) => {
              this.scannedTags.push(element.rfidcode);
              console.log(this.scannedTags);
            });
          } else {
            this.notFoundBarcode.push(item.tags);
            console.log(this.notFoundBarcode);
          }
        });
        // this.scannedTags.push(item.tags);
      });
      console.log(this.scannedTags);
    };
  }
}
