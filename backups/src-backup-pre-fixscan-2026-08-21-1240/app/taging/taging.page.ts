import { Component, ElementRef, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProductService } from '../itemmaster/product.service';
import { HardwareRfidService } from '../services/hardware-rfid.service';
import { IonInput } from '@ionic/angular';

@Component({
  selector: 'app-taging',
  templateUrl: './taging.page.html',
  styleUrls: ['./taging.page.scss'],
})
export class TagingPage implements OnInit, OnDestroy {
  // @ViewChild('myInput', { static: true }) myInput: ElementRef;
  @ViewChild('myInput', { static: false, read: IonInput }) myInput: IonInput;
  readerConnected = false;
  products: any = [];
  productsTemp: any = [];
  tagId: string | null = null;
  pageActive = false;
  private subs: Subscription[] = [];
  constructor(private product: ProductService, private router: Router, private hardwareRfid: HardwareRfidService) {}

  ngOnInit() {
    this.readerConnected = this.hardwareRfid.isConnected;
    this.subs.push(
      this.hardwareRfid.connected$.subscribe(() => { this.readerConnected = true; }),
      this.hardwareRfid.disconnected$.subscribe(() => { this.readerConnected = false; }),
      this.hardwareRfid.tagRead$.subscribe((event) => {
        if (!this.pageActive) return;
        this.tagId = event.epc;
        if (this.tagId) {
          this.router.navigate(['itemmaster', this.tagId]);
        }
      })
    );
    this.getProducts();
  }
  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }
  ionViewDidEnter() {
    this.pageActive = true;
    this.tagId=null;
  }
  ionViewDidLeave() {
    this.pageActive = false;
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
