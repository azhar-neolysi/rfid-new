import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  AfterViewInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { Platform, AlertController, MenuController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import * as XLSX from 'xlsx';
import { Haptics } from '@capacitor/haptics';
import { ProductService } from '../itemmaster/product.service';
import { HardwareRfidService } from '../services/hardware-rfid.service';

@Component({
  selector: 'app-find-tag',
  templateUrl: './find-tag.page.html',
  styleUrls: ['./find-tag.page.scss'],
})
export class FindTagPage implements OnInit, AfterViewInit, OnDestroy {
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
  pageActive = false;
  private subs: Subscription[] = [];

  // Part A: best RSSI seen per EPC
  tagRssiMap: { [epc: string]: number } = {};

  // Part B: tag locator state
  locateMode = false;
  locateTarget = '';
  locating = false;
  proximity = 0;
  currentRssi: number | undefined;
  private locateStartedInventory = false;
  private lastVibrateTime = 0;

  constructor(
    public alertController: AlertController,
    private renderer: Renderer2,
    private product: ProductService,
    private hardwareRfid: HardwareRfidService
  ) {}
  ngOnInit() {
    this.readerConnected = this.hardwareRfid.isConnected;
    this.subs.push(
      this.hardwareRfid.connected$.subscribe(() => { this.readerConnected = true; }),
      this.hardwareRfid.disconnected$.subscribe(() => { this.readerConnected = false; }),
      this.hardwareRfid.tagRead$.subscribe((event) => {
        if (!this.pageActive) return;
        const epc = event.epc;
        if (event.rssi != null) {
          const best = this.tagRssiMap[epc];
          if (best == null || event.rssi > best) {
            this.tagRssiMap[epc] = event.rssi;
          }
        }
        if (this.locating && epc === this.locateTarget.trim()) {
          if (event.rssi != null) {
            this.updateProximity(event.rssi);
            this.maybeVibrate();
          }
        }
        if (this.excelUpload) {
          if (this.scannedTagsTemp.indexOf(epc) === -1) {
            this.scannedTagsTemp.push(epc);
          }
          this.totalScannesTemp = this.scannedTagsTemp.length;
          this.totalTagsTemp = this.scannedTagsTemp.length;
        } else {
          if (this.scannedTags.indexOf(epc) === -1) {
            this.scannedTags.push(epc);
          }
          this.totalScannes = this.scannedTags.length;
          this.totalTags = this.scannedTags.length;
        }
      })
    );
  }
  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }
  ionViewDidEnter() {
    this.pageActive = true;
  }
  ionViewDidLeave() {
    this.pageActive = false;
    if (this.locating) {
      this.stopLocating();
    }
  }
  ngAfterViewInit() {
    this.renderer.selectRootElement(this.myInput.nativeElement).focus();
  }
  get scannedTagRows() {
    return this.scannedTags.map((epc: string) => ({ epc, rssi: this.tagRssiMap[epc] }));
  }
  signalLevel(rssi?: number): number {
    if (rssi == null) return 0;
    if (rssi >= -50) return 4;
    if (rssi >= -65) return 3;
    if (rssi >= -80) return 2;
    return 1;
  }
  onTagClicked(epc: string) {
    this.locateTarget = epc;
    this.enterLocate();
  }
  enterLocate() {
    if (this.locating) return;
    this.proximity = 0;
    this.currentRssi = undefined;
    this.locateMode = true;
  }
  exitLocate() {
    if (this.locating) {
      this.stopLocating();
    }
    this.locateMode = false;
  }
  async startLocating() {
    const target = this.locateTarget.trim();
    if (!target || this.locating || !this.readerConnected) return;
    try {
      await this.hardwareRfid.ensureConnected();
      const wasRunning = this.hardwareRfid.isInventoryRunning;
      await this.hardwareRfid.startInventory();
      this.locateStartedInventory = !wasRunning;
      this.proximity = 0;
      this.currentRssi = undefined;
      this.lastVibrateTime = 0;
      this.locating = true;
    } catch (err) {
      console.error('[FindTag] startLocating failed:', err);
      this.locating = false;
      this.locateStartedInventory = false;
    }
  }
  stopLocating() {
    if (this.locateStartedInventory) {
      this.hardwareRfid.stopInventory().catch(() => {});
    }
    this.locateStartedInventory = false;
    this.locating = false;
  }
  private updateProximity(rssi: number) {
    this.currentRssi = rssi;
    const pct = ((rssi + 90) / 60) * 100;
    this.proximity = Math.max(0, Math.min(100, Math.round(pct)));
  }
  private maybeVibrate() {
    const now = Date.now();
    const interval =
      this.proximity >= 80 ? 200 : this.proximity >= 50 ? 400 : 800;
    if (now - this.lastVibrateTime < interval) return;
    this.lastVibrateTime = now;
    const duration =
      this.proximity >= 80 ? 120 : this.proximity >= 50 ? 70 : 40;
    Haptics.vibrate({ duration }).catch(() => {});
  }
  get proximityLabel(): string {
    if (this.proximity >= 85) return 'Very close';
    if (this.proximity >= 60) return 'Close';
    if (this.proximity >= 30) return 'Getting closer';
    return 'Far';
  }
  get gaugeBackground(): string {
    const color =
      this.proximity >= 66
        ? '#2dd36f'
        : this.proximity >= 33
        ? '#ffc409'
        : '#eb445a';
    return `conic-gradient(${color} ${this.proximity}%, #e3e5e8 0%)`;
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
