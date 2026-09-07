import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DevicemasterPageRoutingModule } from './devicemaster-routing.module';

import { DevicemasterPage } from './devicemaster.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    DevicemasterPageRoutingModule
  ],
  declarations: [DevicemasterPage]
})
export class DevicemasterPageModule {}
