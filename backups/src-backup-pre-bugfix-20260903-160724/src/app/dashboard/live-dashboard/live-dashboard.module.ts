import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { LiveDashboardPageRoutingModule } from './live-dashboard-routing.module';

import { LiveDashboardPage } from './live-dashboard.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LiveDashboardPageRoutingModule
  ],
  declarations: [LiveDashboardPage]
})
export class LiveDashboardPageModule {}
