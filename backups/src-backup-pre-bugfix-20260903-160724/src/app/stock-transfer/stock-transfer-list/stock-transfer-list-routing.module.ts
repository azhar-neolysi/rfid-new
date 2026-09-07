import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { StockTransferListPage } from './stock-transfer-list.page';

const routes: Routes = [
  {
    path: '',
    component: StockTransferListPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StockTransferListPageRoutingModule {}
