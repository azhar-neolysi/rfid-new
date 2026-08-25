import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TagLocatorPageRoutingModule } from './tag-locator-routing.module';

import { TagLocatorPage } from './tag-locator.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TagLocatorPageRoutingModule
  ],
  declarations: [TagLocatorPage]
})
export class TagLocatorPageModule {}
