import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DispatchreportPageRoutingModule } from './dispatchreport-routing.module';

import { DispatchreportPage } from './dispatchreport.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    DispatchreportPageRoutingModule
  ],
  declarations: [DispatchreportPage]
})
export class DispatchreportPageModule {}
