import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AddReferencePage } from './add-reference.page';

const routes: Routes = [
  {
    path: '',
    component: AddReferencePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AddReferencePageRoutingModule {}
