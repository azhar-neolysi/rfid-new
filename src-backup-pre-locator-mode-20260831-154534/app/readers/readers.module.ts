import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ReadersPageRoutingModule } from './readers-routing.module';

import { ReadersPage } from './readers.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReadersPageRoutingModule
  ],
  declarations: [ReadersPage]
})
export class ReadersPageModule {}
