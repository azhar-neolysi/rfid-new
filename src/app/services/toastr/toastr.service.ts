import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class ToastrService {

  constructor(private toastServictoastCtrl: ToastController) { }
  success(msg: any) {
    this.presentToast(msg, 'success');
  }

  warning(msg: any) {
    this.presentToast(msg, 'warning');
  }

  danger(msg: any) {
    this.presentToast(msg, 'danger');
  }

  private async presentToast(msg: any, color1: string) {
    const toast = await this.toastServictoastCtrl.create({
      message: msg,
      duration: 2000,
      position: 'top',
      color: color1,
      mode: 'ios'
    });

    toast.present();
  }

}
