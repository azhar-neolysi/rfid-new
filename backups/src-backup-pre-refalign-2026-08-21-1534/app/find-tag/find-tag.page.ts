import {
  Component,
  OnInit,
  ElementRef,
  AfterViewInit,
  Renderer2,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Haptics } from '@capacitor/haptics';
import * as XLSX from 'xlsx';
import { Subscription } from 'rxjs';
import { ProductService } from '../itemmaster/product.service';
import { HardwareRfidService } from '../services/hardware-rfid.service';

interface RssiInfo {
  last: number;
  best: number;
  updatedAt: number;
}

@Component({
  selector: 'app-find-tag',
  templateUrl: './find-tag.page.html',
  styleUrls: ['./find-tag.page.scss'],
})
export class FindTagPage implements OnInit, AfterViewInit, OnDestroy {
  // @ViewChild('inputTag', { static: false }) myInput: ElementRef;
  @ViewChild('myInput', { static: false, read: ElementRef })
  myInput: ElementRef<HTMLInputElement>;
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

  readerConnected = false;
  private pageActive = false;
  private rssiMap = new Map<string, RssiInfo>();
  private subs: Subscription[] = [];

  locateMode = false;
  locating = false;
  targetEpc = '';
  proximity = 0;
  targetRssi: number | undefined;
  private lastVibrateAt = 0;

  constructor(
    public alertController: AlertController,
    private renderer: Renderer2,
    private product: ProductService,
    private hardwareRfid: HardwareRfidService
  ) {}
  ngOnInit() {
    this.readerConnected = this.hardwareRfid.isConnected;
    this.subs.push(
      this.hardwareRfid.connected$.subscribe(() => {
        this.readerConnected = true;
      }),
      this.hardwareRfid.disconnected$.subscribe(() => {
        this.readerConnected = false;
      }),
      this.hardwareRfid.tagRead$.subscribe((event) => {
        if (!this.pageActive || !event.epc) return;
        const key = event.epc.toUpperCase();
        const existing = this.rssiMap.get(key);
        if (existing) {
          existing.last = event.rssi ?? existing.last;
          if (event.rssi != null && event.rssi > existing.best) {
            existing.best = event.rssi;
          }
          existing.updatedAt = Date.now();
        } else {
          this.rssiMap.set(key, {
            last: event.rssi ?? -999,
            best: event.rssi ?? -999,
            updatedAt: Date.now(),
          });
        }
        if (this.locating) {
          this.onLocateRead(event.epc.toUpperCase(), event.rssi);
        }
      })
    );
  }
  ngAfterViewInit() {
    this.renderer.selectRootElement(this.myInput.nativeElement).focus();
  }
  ionViewDidEnter() {
    this.pageActive = true;
  }
  ionViewDidLeave() {
    this.pageActive = false;
    if (this.locating) {
      this.stopLocator();
    }
  }
  ngOnDestroy() {
    this.subs.forEach((s) => s.unsubscribe());
    if (this.locating) {
      this.stopLocator();
    }
  }

  search(event: any) {
    console.log(event.detail.value);
    const parts = event.detail.value.split('\n');
    console.log(parts);

    this.tagsArr = [];
    this.tagsArr = parts.filter((tag: any) => tag !== '');
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

  /** Live signal info for a scanned tag row (bars + dBm). */
  rssiInfo(tag: any): RssiInfo | null {
    return this.rssiMap.get(String(tag).toUpperCase()) ?? null;
  }

  signalLevel(rssi?: number): number {
    if (rssi == null) return 0;
    if (rssi >= -50) return 4;
    if (rssi >= -65) return 3;
    if (rssi >= -80) return 2;
    return 1;
  }

  signalLevelOf(tag: any): number {
    return this.signalLevel(this.rssiInfo(tag)?.last);
  }

  async startLocator() {
    const target = this.targetEpc.trim().toUpperCase();
    if (!target) return;
    try {
      await this.hardwareRfid.ensureConnected();
      await this.hardwareRfid.forceStopInventory();
      await this.hardwareRfid.forceStartInventoryContinuous();
      this.targetEpc = target;
      this.locateMode = true;
      this.locating = true;
      this.proximity = 0;
      this.targetRssi = undefined;
    } catch (err) {
      console.error('[FindTag] locator start failed:', err);
    }
  }

  stopLocator() {
    this.locateMode = false;
    this.locating = false;
    this.proximity = 0;
    this.hardwareRfid.forceStopInventory().catch(() => {});
  }

  private onLocateRead(epc: string, rssi?: number) {
    if (!this.targetEpc || epc !== this.targetEpc || rssi == null) return;
    this.targetRssi = rssi;
    const pct = Math.max(0, Math.min(100, ((rssi + 90) / 60) * 100));
    this.proximity = Math.round(pct);
    this.maybeVibrate(this.proximity);
  }

  private maybeVibrate(proximity: number) {
    const now = Date.now();
    const throttle = proximity >= 75 ? 200 : proximity >= 40 ? 500 : 900;
    if (now - this.lastVibrateAt < throttle) return;
    this.lastVibrateAt = now;
    Haptics.vibrate({ duration: proximity >= 75 ? 300 : 120 }).catch(() => {});
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
      });
      console.log(this.scannedTags);
    };
  }
}
