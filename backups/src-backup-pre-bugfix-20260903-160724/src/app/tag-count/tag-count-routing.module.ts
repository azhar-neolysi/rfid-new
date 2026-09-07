import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TagCountPage } from './tag-count.page';

const routes: Routes = [
  {
    path: '',
    component: TagCountPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TagCountPageRoutingModule {}
