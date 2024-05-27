import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService } from '../itemmaster/product.service';
import { IonInput } from '@ionic/angular';

@Component({
  selector: 'app-taging',
  templateUrl: './taging.page.html',
  styleUrls: ['./taging.page.scss'],
})
export class TagingPage implements OnInit {
  // @ViewChild('myInput', { static: true }) myInput: ElementRef;
  @ViewChild('myInput', { static: false, read: IonInput }) myInput: IonInput;
  products: any = [];
  productsTemp: any = [];
  tagId: null;
  constructor(private product: ProductService, private router: Router) {}

  ngOnInit() {
    this.getProducts();
  }
  ionViewDidEnter() {
    this.tagId=null;
  }
  getProducts() {
    this.product.getProducts().subscribe((res: any) => {
      console.log(res);
      this.products = res;
      this.productsTemp = res;
    });
  }
  addProduct() {
    this.router.navigate(['itemmaster']);
  }
  search(event: any) {
    console.log(event);
    console.log(event.target.value);
    if(event.target.value){

      this.router.navigate(['itemmaster', event.target.value]);
    }
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
  //     this.products = this.products.filter((item: any) =>
  //       item.barCode
  //         .toLowerCase()
  //         ===(event.detail.value.toLowerCase())
  //     );
  //     console.log(this.products);
  //     if(this.products.length !== 0){
  //       this.router.navigate(['itemmaster', this.products[0].productEntryId]);
  //     }
  //   }
  // }
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
  clear(){
    this.tagId=null;
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
  //       // if (item.rfidcode) {
  //       //   console.log(item.rfidcode.toLowerCase());
  //       //   console.log(event.detail.value.toLowerCase());
  //       //   item.rfidcode
  //       //     .toLowerCase()
  //       //     .includes(event.detail.value.toLowerCase());
  //       // }
  //       item.productName
  //       .toLowerCase()
  //       .includes(event.detail.value.toLowerCase());
  //     });
  //     console.log(this.products);
  //   }
  // }
}
