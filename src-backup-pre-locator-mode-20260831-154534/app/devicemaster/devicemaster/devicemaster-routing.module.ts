import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DevicemasterPage } from './devicemaster.page';

const routes: Routes = [
  {
    path: '',
    component: DevicemasterPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DevicemasterPageRoutingModule {}
