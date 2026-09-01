import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DevicemasterListPage } from './devicemaster-list.page';

const routes: Routes = [
  {
    path: '',
    component: DevicemasterListPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DevicemasterListPageRoutingModule {}
