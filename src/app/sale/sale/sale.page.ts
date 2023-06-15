import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { SaleService } from '../sale.service';
import { Router } from '@angular/router';
import { ProductService } from 'src/app/itemmaster/product.service';
import { AlertController, IonInput } from '@ionic/angular';

@Component({
  selector: 'app-sale',
  templateUrl: './sale.page.html',
  styleUrls: ['./sale.page.scss'],
})
export class SalePage implements OnInit  {
  // @ViewChild('tagId', {static: false, read: IonInput}) inputEl: IonInput;
  // @ViewChild('myInput') myInput: IonInput;


  focus:any=true;
  saleList: any = [];
  tagId:any;
  byteLength: number;
  constructor(
    private sale: SaleService,
    private router: Router,
    private product: ProductService,
    public alertController: AlertController
  ) {}
  // constructor( private router: Router) {}

  ngOnInit() {
    this.getSaleList();
    this.getProducts();
    this.focus=true;
    console.log(this.focus);
  }
  ionViewDidEnter() {
    this.tagId=null;
  }
  getSaleList() {
    this.sale.getSaleList().subscribe((res: any) => {
      console.log(res);
      this.saleList = res;
    });
  }
  saleEntry() {
    this.router.navigate(['sale-entry']);
  }
  editSale() {
    this.router.navigate(['sale-entry', this.tagId]);
  }
  deleteSale(salesId: any) {
    this.sale.deleteSale(salesId).subscribe((res: any) => {
      console.log(res);
      window.location.reload();
    });
  }
  clear(){
    this.tagId=null;
  }
  products: any = [];
  productsTemp: any = [];

  getProducts() {
    this.product.getProducts().subscribe((res: any) => {
      console.log(res);
      this.products = res;
      // this.productsTemp = res;
      this.productsTemp = this.products.filter((item: any) => {
        // console.log(item.rfidcode);
        return item.rfidcode !== null;
      });
      console.log(this.productsTemp);
    });
  }
  addProduct() {
    this.router.navigate(['itemmaster']);
  }
  calculateByteLength(event:any){
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(event.target.value);
    this.byteLength = encodedData.length;
    console.log('byteLength',this.byteLength);
    console.log('RFID ID',event.target.value);
    if(this.byteLength===48){
      this.tagId=event.target.value
      this.editSale();
    }
  }
  // search(event: any) {
  //   // console.log(this.productsTemp);
  //   console.log(event.detail.value);
  //   let parts = event.detail.value.split('\n');
  //   console.log(parts);
  //   // let arr:any=[];

  //   // this.tagsArr = [];
  //   // this.tagsArr.push(parts);
  //   const parts1 = parts.filter((tag: any) => tag !== '');

  //   console.log(parts);
  //   if (parts.length) {
  //     this.router.navigate(['sale-entry', parts1[0]]);
  //   }

  //   // this.products = this.productsTemp;
  //   // console.log(this.products);
  //   // if (event.detail.value === '') {
  //   //   this.products = this.productsTemp;

  //   //   // this.vehicleList = this.vehicleListTemp;
  //   //   // this.vehicleList = this.vehicleList;
  //   // } else {
  //   //   this.products = this.products.filter((item: any) =>{
  //   //   return  item.rfidcode
  //   //       .toLowerCase()
  //   //       === event.detail.value.toLowerCase()
  //   // });
  //   //   console.log(this.products);
  //   //   if(this.products.length !== 0){
  //   //   }else{
  //   //     this.showExitConfirm();
  //   //   }
  //   // }
  // }
  showExitConfirm() {
    this.alertController
      .create({
        header: 'RFID Tag Not Found',
        message: 'Check assigned or Not',
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
  deleteProduct(id: any) {
    this.product.deleteProduct(id).subscribe((res: any) => {
      console.log(res);
      window.location.reload();
    });
  }
  editProduct(id: any) {
    this.router.navigate(['itemmaster', id]);
  }
  onBlur() {
    const activeElement = document.activeElement as HTMLElement;
    activeElement.blur();
  }
  // search(event: any) {
  //   this.products = this.productsTemp;
  //   console.log(this.products);
  //   console.log(event.detail.value);
  //   if (event.detail.value === '') {
  //     this.products = this.productsTemp;

  //     // this.vehicleList = this.vehicleListTemp;
  //     // this.vehicleList = this.vehicleList;
  //   } else {
  //     this.products = this.products.filter((item: any) => {
  //       return item.rfidcode
  //         .toLowerCase()
  //         ===(event.detail.value.toLowerCase());
  //       // if (item.rfidcode) {
  //       //   console.log(item.rfidcode.toLowerCase());
  //       //   console.log(event.detail.value.toLowerCase());
  //       // }
  //       // item.productName
  //       // .toLowerCase()
  //       // .includes(event.detail.value.toLowerCase());
  //     });
  //     console.log(this.products);
  //   }
  // }
}
