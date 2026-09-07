import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CurrentstockreportPageRoutingModule } from './currentstockreport-routing.module';

import { CurrentstockreportPage } from './currentstockreport.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    CurrentstockreportPageRoutingModule
  ],
  declarations: [CurrentstockreportPage]
})
export class CurrentstockreportPageModule {}
