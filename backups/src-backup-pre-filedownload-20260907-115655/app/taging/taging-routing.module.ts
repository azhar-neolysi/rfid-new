import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TagingPage } from './taging.page';

const routes: Routes = [
  {
    path: '',
    component: TagingPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TagingPageRoutingModule {}
