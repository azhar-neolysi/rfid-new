import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CurrentstockreportPage } from './currentstockreport.page';

const routes: Routes = [
  {
    path: '',
    component: CurrentstockreportPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CurrentstockreportPageRoutingModule {}
