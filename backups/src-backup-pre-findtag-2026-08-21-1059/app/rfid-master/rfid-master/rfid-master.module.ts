import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule,ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RfidMasterPageRoutingModule } from './rfid-master-routing.module';

import { RfidMasterPage } from './rfid-master.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RfidMasterPageRoutingModule,
    ReactiveFormsModule
  ],
  declarations: [RfidMasterPage]
})
export class RfidMasterPageModule {}
