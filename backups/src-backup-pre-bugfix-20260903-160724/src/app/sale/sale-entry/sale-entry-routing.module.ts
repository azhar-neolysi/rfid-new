import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SaleEntryPage } from './sale-entry.page';

const routes: Routes = [
  {
    path: '',
    component: SaleEntryPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SaleEntryPageRoutingModule {}
