import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ReferenceListPageRoutingModule } from './reference-list-routing.module';

import { ReferenceListPage } from './reference-list.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReferenceListPageRoutingModule
  ],
  declarations: [ReferenceListPage]
})
export class ReferenceListPageModule {}
