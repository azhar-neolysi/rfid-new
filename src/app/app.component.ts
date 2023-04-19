import { Component, ViewChild } from '@angular/core';
import { Platform, AlertController, MenuController } from '@ionic/angular';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  pages = [
    {
      title: 'Dashboard',
      open: false,
      icon: 'home',
      children: [
        {
          title: 'Dashboard',
          url: '/dashboard',
          icon: 'grid',
        },
        {
          title: 'Live Dashboard',
          url: '/live-dashboard',
          icon: 'apps',
        },
      ],
    },
    {
      title: 'Masters',
      open: false,
      icon: 'logo-medium',
      children: [
        {
          title: 'Company Master',
          url: '/companymaster',
          icon: 'business',
        },
        {
          title: 'RFID Master',
          url: '/rfid-list',
          icon: 'laptop',
        },
        {
          title: 'Product Master',
          url: '/item-list',
          icon: 'color-filter',
        },
        {
          title: 'Device Master',
          url: '/devicemaster-list',
          icon: 'laptop',
        },
      ],
    },
    {
      title: 'Reports',
      open: false,
      icon: 'newspaper',
      children: [
        {
          title: 'Live Stock Report',
          url: '/currentstockreport',
          icon: 'list',
        },
        {
          title: 'Delivery Report',
          url: '/dispatchreport',
          icon: 'list-circle',
        },
      ],
    },
    {
      title: 'Setting',
      open: false,
      icon: 'settings-sharp',
      children: [
        {
          title: 'Employess',
          url: '/employee',
          icon: 'people',
        },
        {
          title: 'Reference',
          url: '/reference',
          icon: 'unlink-sharp',
        },
        {
          title: 'Reference List',
          url: '/reference-list',
          icon: 'link-sharp',
        },
      ],
    },

    {
      title: 'Sale',
      open: false,
      icon: 'snow-sharp',
      url: '/sale',
      // <ion-icon name="snow-sharp"></ion-icon>
      children: [],
    },
    {
      title: 'Stock Ttransfer',
      open: false,
      icon: 'arrow-redo-sharp',
      url: '/stock-transfer-list',
      // <ion-icon name="arrow-redo-sharp"></ion-icon>
      children: [],
    },
  ];
  backNo = 0;
  constructor(
    private platform: Platform,
    // private splashScreen: SplashScreen,

    private menuCtrl: MenuController,
    private router: Router,
    public alertController: AlertController,
    private location: Location
  ) {
    console.log('initializeApp');
    this.initializeApp();
  }
  initializeApp() {

    this.platform.ready().then(() => {
      // this.statusBar.styleDefault();
      // this.splashScreen.hide();
    });

    this.platform.backButton.subscribeWithPriority(0, (processNextHandler) => {
      console.log('Back press handler!');
      console.log(this.backNo);
      if (
        this.location.isCurrentPathEqualTo('/dashboard') ||
        this.backNo === 2
      ) {
        // Show Exit Alert!
        console.log('Show Exit Alert!');
        this.showExitConfirm();
        processNextHandler();
      } else {
        // Navigate to back page
        console.log('Navigate to back page');
        this.backNo++;
        this.location.back();
        // this.showExitConfirm();
        // processNextHandler();
      }
    });

    this.platform.backButton.subscribeWithPriority(5, () => {
      console.log('Handler called to force close!');
      this.alertController
        .getTop()
        .then((r) => {
          if (r) {
            (navigator as any).app.exitApp();
          }
        })
        .catch((e) => {
          console.log(e);
        });
    });
  }
  showExitConfirm() {
    this.alertController
      .create({
        header: 'App termination',
        message: 'Do you want to close the app?',
        backdropDismiss: false,
        // mode:'ios',
        cssClass: 'custom-alert',
        buttons: [
          {
            text: 'Stay',
            role: 'cancel',
            cssClass: 'alert-button-cancel',
            handler: () => {
              this.backNo = 0;
              console.log('Application exit prevented!');
            },
          },
          {
            text: 'Exit',
            cssClass: 'alert-button-confirm',
            handler: () => {
              (navigator as any).app.exitApp();
            },
          },
        ],
      })
      .then((alert) => {
        alert.present();
      });
  }
}
