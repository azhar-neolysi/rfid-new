import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { StockTransferListPageRoutingModule } from './stock-transfer-list-routing.module';

import { StockTransferListPage } from './stock-transfer-list.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    StockTransferListPageRoutingModule
  ],
  declarations: [StockTransferListPage]
})
export class StockTransferListPageModule {}
