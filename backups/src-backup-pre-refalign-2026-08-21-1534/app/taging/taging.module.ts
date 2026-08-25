import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TagingPageRoutingModule } from './taging-routing.module';

import { TagingPage } from './taging.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TagingPageRoutingModule
  ],
  declarations: [TagingPage]
})
export class TagingPageModule {}
