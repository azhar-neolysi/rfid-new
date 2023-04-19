import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ReferencePage } from './reference.page';

const routes: Routes = [
  {
    path: '',
    component: ReferencePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReferencePageRoutingModule {}
