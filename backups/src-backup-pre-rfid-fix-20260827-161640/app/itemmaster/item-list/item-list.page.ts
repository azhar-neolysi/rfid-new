import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ProductService } from '../product.service';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { HardwareRfidService } from '../../services/hardware-rfid.service';
import { ToastrService } from 'src/app/services/toastr/toastr.service';
import { BarcodeService } from 'src/app/services/barcode.service';

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
  barcodeScan: any;
  private subs: Subscription[] = [];
  constructor(
    private product: ProductService,
    private router: Router,
    private toast: ToastrService,
    private alertCtrl: AlertController,
    private hardwareRfid: HardwareRfidService,
    private barcodeService: BarcodeService
  ) {}

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
    this.barcodeScan = null;
  }
  ionViewDidLeave() {
    this.pageActive = false;
  }
  getProducts() {
    this.product.GetLastProducts().subscribe({
      next: (res: any) => {
        this.products = res;
        this.productsTemp = res;
      },
      error: () => this.toast.danger('Failed to load products'),
    });
  }
  addProduct() {
    this.router.navigate(['itemmaster']);
  }
  search(event: any) {
    if (event.target.value) {
      this.router.navigate(['itemmaster', event.target.value]);
    }
  }
  async deleteProduct(id: any) {
    const alert = await this.alertCtrl.create({
      header: 'Confirm Delete',
      message: 'Delete this product?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.product.deleteProduct(id).subscribe({
              next: () => {
                this.toast.success('Product deleted');
                this.products = this.products.filter(
                  (item: any) => item.productEntryId !== id
                );
                this.productsTemp = this.productsTemp.filter(
                  (item: any) => item.productEntryId !== id
                );
              },
              error: () => this.toast.danger('Failed to delete product'),
            });
          },
        },
      ],
    });
    await alert.present();
  }
  editProduct(id: any) {
    this.router.navigate(['itemmaster', id]);
  }
  onBlur() {
    const activeElement = document.activeElement as HTMLElement;
    activeElement.blur();
  }
  async scanBarcode() {
    const code = await this.barcodeService.scan();
    if (code) {
      this.barcodeScan = code;
      this.router.navigate(['itemmaster', code]);
    }
  }
}
