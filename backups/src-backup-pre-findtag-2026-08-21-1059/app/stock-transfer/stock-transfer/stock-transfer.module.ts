import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { StockTransferPageRoutingModule } from './stock-transfer-routing.module';

import { StockTransferPage } from './stock-transfer.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    StockTransferPageRoutingModule
  ],
  declarations: [StockTransferPage]
})
export class StockTransferPageModule {}
