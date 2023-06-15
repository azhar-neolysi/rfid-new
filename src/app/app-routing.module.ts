import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./dashboard/dashboard/dashboard.module').then( m => m.DashboardPageModule)
  },
  {
    path: 'live-dashboard',
    loadChildren: () => import('./dashboard/live-dashboard/live-dashboard.module').then( m => m.LiveDashboardPageModule)
  },
  {
    path: 'companymaster',
    loadChildren: () => import('./companymaster/companymaster/companymaster.module').then( m => m.CompanymasterPageModule)
  },
  {
    path: 'devicemaster',
    loadChildren: () => import('./devicemaster/devicemaster/devicemaster.module').then( m => m.DevicemasterPageModule)
  },
  {
    path: 'devicemaster/:id',
    loadChildren: () => import('./devicemaster/devicemaster/devicemaster.module').then( m => m.DevicemasterPageModule)
  },
  {
    path: 'itemmaster',
    loadChildren: () => import('./itemmaster/itemmaster/itemmaster.module').then( m => m.ItemmasterPageModule)
  },
  {
    path: 'itemmaster/:id',
    loadChildren: () => import('./itemmaster/itemmaster/itemmaster.module').then( m => m.ItemmasterPageModule)
  },
  {
    path: 'currentstockreport',
    loadChildren: () => import('./reports/currentstockreport/currentstockreport.module').then( m => m.CurrentstockreportPageModule)
  },
  {
    path: 'dispatchreport',
    loadChildren: () => import('./reports/dispatchreport/dispatchreport.module').then( m => m.DispatchreportPageModule)
  },
  {
    path: 'employee',
    loadChildren: () => import('./employees/employee/employee.module').then( m => m.EmployeePageModule)
  },
  {
    path: 'add-employee',
    loadChildren: () => import('./employees/add-employee/add-employee.module').then( m => m.AddEmployeePageModule)
  },
  {
    path: 'add-employee/:id',
    loadChildren: () => import('./employees/add-employee/add-employee.module').then( m => m.AddEmployeePageModule)
  },
  {
    path: 'location',
    loadChildren: () => import('./location/location/location.module').then( m => m.LocationPageModule)
  },
  {
    path: 'add-location',
    loadChildren: () => import('./location/add-location/add-location.module').then( m => m.AddLocationPageModule)
  },
  {
    path: 'reference',
    loadChildren: () => import('./reference/reference/reference.module').then( m => m.ReferencePageModule)
  },
  {
    path: 'add-reference',
    loadChildren: () => import('./reference/add-reference/add-reference.module').then( m => m.AddReferencePageModule)
  },
  {
    path: 'add-reference/:id',
    loadChildren: () => import('./reference/add-reference/add-reference.module').then( m => m.AddReferencePageModule)
  },
  {
    path: 'reference-list',
    loadChildren: () => import('./reference-list/reference-list/reference-list.module').then( m => m.ReferenceListPageModule)
  },
  {
    path: 'add-reference-list',
    loadChildren: () => import('./reference-list/add-reference-list/add-reference-list.module').then( m => m.AddReferenceListPageModule)
  },
  {
    path: 'add-reference-list/:id',
    loadChildren: () => import('./reference-list/add-reference-list/add-reference-list.module').then( m => m.AddReferenceListPageModule)
  },
  {
    path: 'users',
    loadChildren: () => import('./users/users/users.module').then( m => m.UsersPageModule)
  },
  {
    path: 'add-users',
    loadChildren: () => import('./users/add-users/add-users.module').then( m => m.AddUsersPageModule)
  },
  {
    path: 'role',
    loadChildren: () => import('./role/role.module').then( m => m.RolePageModule)
  },
  {
    path: 'sale',
    loadChildren: () => import('./sale/sale/sale.module').then( m => m.SalePageModule)
  },
  {
    path: 'sale-entry',
    loadChildren: () => import('./sale/sale-entry/sale-entry.module').then( m => m.SaleEntryPageModule)
  },
  {
    path: 'sale-entry/:id',
    loadChildren: () => import('./sale/sale-entry/sale-entry.module').then( m => m.SaleEntryPageModule)
  },
  {
    path: 'stock-transfer',
    loadChildren: () => import('./stock-transfer/stock-transfer/stock-transfer.module').then( m => m.StockTransferPageModule)
  },
  {
    path: 'stock-transfer/:id',
    loadChildren: () => import('./stock-transfer/stock-transfer/stock-transfer.module').then( m => m.StockTransferPageModule)
  },
  {
    path: 'rfidmaster',
    loadChildren: () => import('./rfid-master/rfid-master/rfid-master.module').then( m => m.RfidMasterPageModule)
  },
  {
    path: 'rfidmaster/:id',
    loadChildren: () => import('./rfid-master/rfid-master/rfid-master.module').then( m => m.RfidMasterPageModule)
  },
  {
    path: 'rfid-list',
    loadChildren: () => import('./rfid-master/rfid-list/rfid-list.module').then( m => m.RfidListPageModule)
  },
  {
    path: 'stock-transfer-list',
    loadChildren: () => import('./stock-transfer/stock-transfer-list/stock-transfer-list.module').then( m => m.StockTransferListPageModule)
  },
  {
    path: 'devicemaster-list',
    loadChildren: () => import('./devicemaster/devicemaster-list/devicemaster-list.module').then( m => m.DevicemasterListPageModule)
  },

  {
    path: 'item-list',
    loadChildren: () => import('./itemmaster/item-list/item-list.module').then( m => m.ItemListPageModule)
  },
  {
    path: 'find-tag',
    loadChildren: () => import('./find-tag/find-tag.module').then( m => m.FindTagPageModule)
  },
  {
    path: 'taging',
    loadChildren: () => import('./taging/taging.module').then( m => m.TagingPageModule)
  },

  {
    path: 'segment',
    loadChildren: () => import('./segment/segment/segment.module').then( m => m.SegmentPageModule)
  },
  {
    path: 'add-segment',
    loadChildren: () => import('./segment/add-segment/add-segment.module').then( m => m.AddSegmentPageModule)
  },


];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
