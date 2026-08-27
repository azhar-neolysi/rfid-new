import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AddRolePageRoutingModule } from './add-role-routing.module';
import { AddRolePage } from './add-role.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    AddRolePageRoutingModule,
  ],
  declarations: [AddRolePage],
})
export class AddRolePageModule {}
