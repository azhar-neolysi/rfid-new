import { Component, OnInit, OnDestroy } from '@angular/core';
import { ModalController } from '@ionic/angular';
import {
  BarcodeScanner,
  SupportedFormat,
  ScanResult,
} from '@capacitor-community/barcode-scanner';

@Component({
  selector: 'app-scan',
  templateUrl: './scan.page.html',
  styleUrls: ['./scan.page.scss'],
})
export class ScanPage implements OnInit, OnDestroy {
  scanSuccess = false;

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {
    this.startScan();
  }

  ngOnDestroy() {
    this.cleanup();
  }

  async startScan() {
    try {
      const permission = await BarcodeScanner.checkPermission({ force: true });
      if (!permission.granted) {
        this.modalCtrl.dismiss(null);
        return;
      }

      await BarcodeScanner.hideBackground();

      const result: ScanResult = await BarcodeScanner.startScan({
        targetedFormats: [
          SupportedFormat.QR_CODE,
          SupportedFormat.EAN_13,
          SupportedFormat.EAN_8,
          SupportedFormat.UPC_A,
          SupportedFormat.UPC_E,
          SupportedFormat.CODE_128,
          SupportedFormat.CODE_39,
          SupportedFormat.CODE_93,
          SupportedFormat.ITF,
          SupportedFormat.DATA_MATRIX,
          SupportedFormat.AZTEC,
          SupportedFormat.PDF_417,
        ],
      });

      if (result.hasContent) {
        this.scanSuccess = true;
        setTimeout(() => {
          this.modalCtrl.dismiss(result.content);
        }, 400);
      } else {
        this.modalCtrl.dismiss(null);
      }
    } catch (err: any) {
      if (err?.message !== 'Scan canceled') {
        console.error('[ScanPage] scan error:', err);
      }
      this.modalCtrl.dismiss(null);
    }
  }

  cancel() {
    this.cleanup();
    this.modalCtrl.dismiss(null);
  }

  private async cleanup() {
    try {
      await BarcodeScanner.showBackground();
      await BarcodeScanner.stopScan({ resolveScan: false });
    } catch {}
  }
}
