import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RfidListPageRoutingModule } from './rfid-list-routing.module';

import { RfidListPage } from './rfid-list.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RfidListPageRoutingModule
  ],
  declarations: [RfidListPage]
})
export class RfidListPageModule {}
