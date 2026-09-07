import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FindTagPageRoutingModule } from './find-tag-routing.module';

import { FindTagPage } from './find-tag.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FindTagPageRoutingModule
  ],
  declarations: [FindTagPage]
})
export class FindTagPageModule {}
