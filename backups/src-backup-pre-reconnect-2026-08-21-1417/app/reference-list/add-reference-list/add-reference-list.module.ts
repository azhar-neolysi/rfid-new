import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule,ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AddReferenceListPageRoutingModule } from './add-reference-list-routing.module';

import { AddReferenceListPage } from './add-reference-list.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AddReferenceListPageRoutingModule,
    ReactiveFormsModule
  ],
  declarations: [AddReferenceListPage]
})
export class AddReferenceListPageModule {}
