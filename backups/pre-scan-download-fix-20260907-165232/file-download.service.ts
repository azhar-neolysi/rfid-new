import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';

@Injectable({ providedIn: 'root' })
export class FileDownloadService {
  isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  async templateDownload(file: string): Promise<boolean> {
    if (!this.isNative()) return false;
    try {
      const res = await fetch(`assets/templates/${file}`);
      if (!res.ok) throw new Error(`Template request failed (${res.status})`);
      const buffer = await res.arrayBuffer();
      const base64 = this.arrayBufferToBase64(buffer);
      await this.saveToDocuments(base64, file);
      return true;
    } catch (err) {
      console.error('[FileDownload] template download failed', err);
      return false;
    }
  }

  async exportFile(base64: string, fileName: string): Promise<boolean> {
    if (!this.isNative()) return false;
    try {
      await this.saveToDocuments(base64, fileName);
      return true;
    } catch (err) {
      console.error('[FileDownload] export failed', err);
      return false;
    }
  }

  private async saveToDocuments(base64: string, fileName: string): Promise<void> {
    const permissions = await Filesystem.checkPermissions();
    if (permissions.publicStorage !== 'granted') {
      const requested = await Filesystem.requestPermissions();
      if (requested.publicStorage !== 'granted') {
        throw new Error('Storage permission was not granted');
      }
    }
    await Filesystem.writeFile({
      path: `RFID/${fileName}`,
      data: base64,
      directory: Directory.Documents,
      recursive: true,
    });
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk) as any);
    }
    return btoa(binary);
  }
}
