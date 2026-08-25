import { Component, OnInit, Optional } from '@angular/core';
import {
  Platform,
  AlertController,
  NavController,
  IonRouterOutlet,
} from '@ionic/angular';
import { App } from '@capacitor/app';
import { HardwareRfidService } from './services/hardware-rfid.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  readerConnected = false;
  readerName = '';
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
          title: 'Product Entry',
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
          title: 'Employees',
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
      title: 'Mapping',
      open: false,
      icon: 'radio',
      url: '/tagging',
      children: [],
    },
    {
      title: 'Sale',
      open: false,
      icon: 'snow-sharp',
      url: '/sale',
      children: [],
    },
    {
      title: 'Stock Transfer',
      open: false,
      icon: 'arrow-redo-sharp',
      url: '/stock-transfer',
      children: [],
    },
    {
      title: 'Segment',
      open: false,
      icon: 'grid-sharp',
      url: '/add-segment',
      children: [],
    },

    {
      title: 'Find Tags',
      open: false,
      icon: 'search-sharp',
      url: '/find-tag',
      children: [],
    },

    {
      title: 'Tag Count',
      open: false,
      icon: 'checkbox-sharp',
      url: '/tag-count',
      children: [],
    },
  ];
  private backButtonPressed = 0;
  constructor(
    private platform: Platform,
    private alertController: AlertController,
    private hardwareRfid: HardwareRfidService,
    private auth: AuthService,
    @Optional() private routerOutlet?: IonRouterOutlet
  ) {
    this.platform.backButton.subscribeWithPriority(-1, () => {
      if (!this.routerOutlet?.canGoBack()) {
        App.exitApp();
      }
    });
  }
  ngOnInit(): void {
    this.hardwareRfid.connected$.subscribe((name) => {
      this.readerConnected = true;
      this.readerName = name || '';
    });
    this.hardwareRfid.disconnected$.subscribe(() => {
      this.readerConnected = false;
      this.readerName = '';
    });
    this.platform.ready().then(() => {
      this.hardwareRfid.connect().catch(() => {});
    });
    this.platform.backButton.subscribeWithPriority(9999, () => {
      if (this.backButtonPressed === 0) {
        this.backButtonPressed++;
        setTimeout(() => (this.backButtonPressed = 0), 2000); // Reset the counter after 2 seconds
      } else {
        this.exitApp();
      }
    });
  }
  ionViewWillLeave() {
    this.platform.backButton.unsubscribe();
  }
  async exitApp() {
    const alert = await this.alertController.create({
      header: 'Confirm Exit',
      message: 'Are you sure you want to exit the app?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Exit',
          handler: () => {
            (navigator as any)['app'].exitApp();
          },
        },
      ],
    });

    await alert.present();
  }

  logout(): void {
    this.auth.logout();
  }
}
