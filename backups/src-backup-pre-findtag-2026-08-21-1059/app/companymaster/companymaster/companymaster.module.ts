import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CompanymasterPageRoutingModule } from './companymaster-routing.module';

import { CompanymasterPage } from './companymaster.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CompanymasterPageRoutingModule
  ],
  declarations: [CompanymasterPage]
})
export class CompanymasterPageModule {}
