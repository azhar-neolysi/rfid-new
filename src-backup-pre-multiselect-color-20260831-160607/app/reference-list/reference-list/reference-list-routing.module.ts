import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ReferenceListPage } from './reference-list.page';

const routes: Routes = [
  {
    path: '',
    component: ReferenceListPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReferenceListPageRoutingModule {}
