import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ProductService } from '../product.service';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { HardwareRfidService } from '../../services/hardware-rfid.service';

@Component({
  selector: 'app-item-list',
  templateUrl: './item-list.page.html',
  styleUrls: ['./item-list.page.scss'],
})
export class ItemListPage implements OnInit, OnDestroy {

  readerConnected = false;
  pageActive = false;
  products: any = [];
  productsTemp: any = [];
  barcodeScan:any;
  private subs: Subscription[] = [];
  constructor(private product: ProductService, private router: Router,private toast: ToastController, private hardwareRfid: HardwareRfidService) {}

  async ngOnInit() {
    this.readerConnected = this.hardwareRfid.isConnected;
    this.subs.push(
      this.hardwareRfid.connected$.subscribe(() => { this.readerConnected = true; }),
      this.hardwareRfid.disconnected$.subscribe(() => { this.readerConnected = false; }),
      this.hardwareRfid.tagRead$.subscribe((event) => {
        if (!this.pageActive) return;
        this.barcodeScan = event.epc;
        if (this.barcodeScan) {
          this.router.navigate(['itemmaster', this.barcodeScan]);
        }
      })
    );
   await this.getProducts();
  }
  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }
  ionViewDidEnter() {
    this.pageActive = true;
    this.barcodeScan=null;
  }
  ionViewDidLeave() {
    this.pageActive = false;
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
