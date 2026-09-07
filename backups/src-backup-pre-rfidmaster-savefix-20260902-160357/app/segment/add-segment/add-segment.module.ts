import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AddSegmentPageRoutingModule } from './add-segment-routing.module';

import { AddSegmentPage } from './add-segment.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    AddSegmentPageRoutingModule
  ],
  declarations: [AddSegmentPage]
})
export class AddSegmentPageModule {}
