import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RfidListPage } from './rfid-list.page';

const routes: Routes = [
  {
    path: '',
    component: RfidListPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RfidListPageRoutingModule {}
