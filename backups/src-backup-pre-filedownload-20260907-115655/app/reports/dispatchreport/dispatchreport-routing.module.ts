import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DispatchreportPage } from './dispatchreport.page';

const routes: Routes = [
  {
    path: '',
    component: DispatchreportPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DispatchreportPageRoutingModule {}
