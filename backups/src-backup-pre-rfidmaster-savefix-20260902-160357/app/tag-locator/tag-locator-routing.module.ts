import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TagLocatorPage } from './tag-locator.page';

const routes: Routes = [
  {
    path: '',
    component: TagLocatorPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TagLocatorPageRoutingModule {}
