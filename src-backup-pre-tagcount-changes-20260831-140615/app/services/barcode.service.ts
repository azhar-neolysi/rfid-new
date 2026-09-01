import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  BarcodeScanner,
  SupportedFormat,
  ScanResult,
} from '@capacitor-community/barcode-scanner';
import { AlertController } from '@ionic/angular';

@Injectable({ providedIn: 'root' })
export class BarcodeService {
  private scannerActive = false;

  constructor(private alertCtrl: AlertController) {}

  isSupported(): boolean {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  }

  async scan(): Promise<string | null> {
    if (!this.isSupported()) {
      await this.showAlert('Not available', 'Barcode scanning is only available on Android devices.');
      return null;
    }

    const permission = await BarcodeScanner.checkPermission({ force: true });
    if (!permission.granted) {
      if (permission.denied) {
        await this.showAlert(
          'Permission Denied',
          'Camera permission was permanently denied. Please enable it in app settings.',
        );
        await BarcodeScanner.openAppSettings();
      } else {
        await this.showAlert('Permission Required', 'Camera permission is needed to scan barcodes.');
      }
      return null;
    }

    try {
      this.scannerActive = true;
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

      await BarcodeScanner.showBackground();
      this.scannerActive = false;

      if (result.hasContent) {
        return result.content;
      }
      return null;
    } catch (err: any) {
      await BarcodeScanner.showBackground();
      this.scannerActive = false;
      if (err?.message !== 'Scan canceled') {
        console.error('[BarcodeService] scan error:', err);
      }
      return null;
    }
  }

  async stopScan(): Promise<void> {
    if (this.scannerActive) {
      await BarcodeScanner.stopScan({ resolveScan: false });
      await BarcodeScanner.showBackground();
      this.scannerActive = false;
    }
  }

  private async showAlert(header: string, message: string): Promise<void> {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}
