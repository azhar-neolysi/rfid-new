import { Injectable } from '@angular/core';
import { Capacitor, registerPlugin } from '@capacitor/core';

interface NativeDownloadPlugin {
  save(options: {
    fileName: string;
    base64: string;
    mimeType: string;
  }): Promise<{ uri: string; path: string }>;
}

const NativeDownload = registerPlugin<NativeDownloadPlugin>('NativeDownload');

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
      await this.saveToDownloads(base64, file);
      return true;
    } catch (err) {
      console.error('[FileDownload] template download failed', err);
      return false;
    }
  }

  async exportFile(base64: string, fileName: string): Promise<boolean> {
    if (!this.isNative()) return false;
    try {
      await this.saveToDownloads(base64, fileName);
      return true;
    } catch (err) {
      console.error('[FileDownload] export failed', err);
      return false;
    }
  }

  private async saveToDownloads(base64: string, fileName: string): Promise<void> {
    await NativeDownload.save({
      fileName,
      base64,
      mimeType: this.getMimeType(fileName),
    });
  }

  private getMimeType(fileName: string): string {
    return fileName.toLowerCase().endsWith('.xlsx')
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'application/octet-stream';
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
