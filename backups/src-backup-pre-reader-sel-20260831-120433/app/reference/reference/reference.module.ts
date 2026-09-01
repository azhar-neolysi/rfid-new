import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ReferencePageRoutingModule } from './reference-routing.module';

import { ReferencePage } from './reference.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReferencePageRoutingModule
  ],
  declarations: [ReferencePage]
})
export class ReferencePageModule {}
