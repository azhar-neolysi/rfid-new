import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LiveDashboardPage } from './live-dashboard.page';

const routes: Routes = [
  {
    path: '',
    component: LiveDashboardPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LiveDashboardPageRoutingModule {}
