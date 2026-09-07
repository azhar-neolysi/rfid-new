import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DevicemasterListPageRoutingModule } from './devicemaster-list-routing.module';

import { DevicemasterListPage } from './devicemaster-list.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DevicemasterListPageRoutingModule
  ],
  declarations: [DevicemasterListPage]
})
export class DevicemasterListPageModule {}
