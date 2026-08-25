import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProductService } from '../itemmaster/product.service';
import { HardwareRfidService } from '../services/hardware-rfid.service';
import { IonInput, AlertController } from '@ionic/angular';
import { ToastrService } from '../services/toastr/toastr.service';

@Component({
  selector: 'app-taging',
  templateUrl: './taging.page.html',
  styleUrls: ['./taging.page.scss'],
})
export class TagingPage implements OnInit, OnDestroy {
  @ViewChild('myInput', { static: false, read: IonInput }) myInput: IonInput;
  readerConnected = false;
  products: any = [];
  productsTemp: any = [];
  tagId: string | null = null;
  pageActive = false;
  private subs: Subscription[] = [];
  constructor(
    private product: ProductService,
    private router: Router,
    private hardwareRfid: HardwareRfidService,
    private alertCtrl: AlertController,
    private toast: ToastrService
  ) {}

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
    this.tagId = null;
  }
  ionViewDidLeave() {
    this.pageActive = false;
  }
  getProducts() {
    this.product.getProducts().subscribe({
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
  clear() {
    this.tagId = null;
  }
}
