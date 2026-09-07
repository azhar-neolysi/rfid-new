import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule,ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AddReferencePageRoutingModule } from './add-reference-routing.module';

import { AddReferencePage } from './add-reference.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AddReferencePageRoutingModule,
    ReactiveFormsModule
  ],
  declarations: [AddReferencePage]
})
export class AddReferencePageModule {}
