import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ItemmasterPage } from './itemmaster.page';

const routes: Routes = [
  {
    path: '',
    component: ItemmasterPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ItemmasterPageRoutingModule {}
