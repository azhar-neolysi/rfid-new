import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RfidMasterPage } from './rfid-master.page';

const routes: Routes = [
  {
    path: '',
    component: RfidMasterPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RfidMasterPageRoutingModule {}
