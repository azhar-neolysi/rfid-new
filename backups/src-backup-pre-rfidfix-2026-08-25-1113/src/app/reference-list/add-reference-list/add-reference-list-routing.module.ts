import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AddReferenceListPage } from './add-reference-list.page';

const routes: Routes = [
  {
    path: '',
    component: AddReferenceListPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AddReferenceListPageRoutingModule {}
