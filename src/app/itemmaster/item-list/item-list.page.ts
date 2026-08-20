import { Component, OnInit } from '@angular/core';
import { ProductService } from '../product.service';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-item-list',
  templateUrl: './item-list.page.html',
  styleUrls: ['./item-list.page.scss'],
})
export class ItemListPage implements OnInit {

  readerConnected = false;
  products: any = [];
  productsTemp: any = [];
  barcodeScan:any;
  constructor(private product: ProductService, private router: Router,private toast: ToastController,) {}

  async ngOnInit() {
   await this.getProducts();
  }
  ionViewDidEnter() {
    this.barcodeScan=null;
  }
  getProducts() {
    this.product.GetLastProducts().subscribe((res: any) => {
      this.products = res;
      console.log(this.products);

      this.productsTemp = res;
    });
  }
  addProduct() {
    this.router.navigate(['itemmaster']);
  }
  search(event: any) {
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
    this.product.deleteProduct(id).subscribe(async (res: any) => {
      console.log(res);
      // window.location.reload();
      const toast = await this.toast.create({
        color: 'success',
        message: 'Sucessfully Deleted',
        position: 'top',
        duration: 2000,
      });
      toast.present();
      toast.onDidDismiss().then(() => {
        window.location.reload(); // Reloading the page
      });
    });
  }
  editProduct(id: any) {
    console.log(id);
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
  clearRfid(){

  }
}
