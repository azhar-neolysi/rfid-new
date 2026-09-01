import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CompanymasterPage } from './companymaster.page';

const routes: Routes = [
  {
    path: '',
    component: CompanymasterPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CompanymasterPageRoutingModule {}
