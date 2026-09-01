import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({ providedIn: 'root' })
export class ToastrService {
  constructor(private toastController: ToastController) {}

  success(msg: string): void {
    this.presentToast(msg, 'success');
  }

  warning(msg: string): void {
    this.presentToast(msg, 'warning');
  }

  danger(msg: string): void {
    this.presentToast(msg, 'danger');
  }

  private async presentToast(msg: string, color: string): Promise<void> {
    const toast = await this.toastController.create({
      message: msg,
      duration: 2000,
      position: 'top',
      color,
      mode: 'ios',
    });
    toast.present();
  }
}
