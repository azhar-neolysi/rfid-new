import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule,ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SaleEntryPageRoutingModule } from './sale-entry-routing.module';

import { SaleEntryPage } from './sale-entry.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SaleEntryPageRoutingModule,
    ReactiveFormsModule
  ],
  declarations: [SaleEntryPage]
})
export class SaleEntryPageModule {}
