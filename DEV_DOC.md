# RFID App Refactoring - Dev Documentation

**Date:** 2026-08-19  
**Backup Branch:** `backup/pre-refactor`

---

## Summary of Changes

### Phase 1: Security & Repo Hygiene
- **`.gitignore`** updated: `key/`, `*.jks`, `*.keystore`, `local.properties`, `backup/`, `sdk/`
- Removed `key/rfid.jks`, `xlsx-populate.d.ts`, `key/`, `sdk/`, `backup/` from repo
- Uninstalled 13 dead packages: `xlsx-populate`, `cordova-plugin-file`, `@awesome-cordova-plugins/*`
- Removed Cordova imports from `app.module.ts` and `rfid-master.page.ts`

### Phase 2: TypeScript Models (24 files)
Created `src/app/models/` with interfaces from Swagger spec:
- `base.model.ts`, `index.ts` (barrel), plus interfaces for all 22 API schemas
- Covers: User, Org, Holding, Location, Employee, EmpUserMapping, ProductEntry, Rfidmaster, Reference, ReferenceList, DeviceMaster, Segment, SegmentReferenceListMapping, ProductEntryReferenceListMapping, Sale, StockTransfer, Role, Menu, Window, WindowAccess, TrialRoom, TrialRoomProductEntryMapping

### Phase 3: Base Service, Interceptors, Auth
| File | Purpose |
|------|---------|
| `services/base.service.ts` | Shared GET/POST/PUT/DELETE helpers using `environment.baseUrl` |
| `interceptors/error.interceptor.ts` | Global HTTP error handling with toast |
| `interceptors/auth.interceptor.ts` | Bearer token injection |
| `services/auth.service.ts` | Login/logout/token management (localStorage) |
| `guards/auth.guard.ts` | Route protection |
| `login/login.page.ts` | Login page (module, routing, component) |

### Phase 4: Refactored 12 Domain Services
All extend `BaseService` with proper types:
- `product.service.ts`, `rfid.service.ts`, `employee.service.ts`, `user.service.ts`
- `role.service.ts` (was empty, now fully implemented)
- `stock.service.ts`, `sale.service.ts`, `segment.service.ts`
- `reference.service.ts`, `reference-list.service.ts`, `devicemaster.service.ts`
- **Bug fixes:** `deleteEmployee` and `deleteStockTransfer` were using GET instead of DELETE
- **Bug fix:** `toastr.service.ts` typo `toastServictoastCtrl` → `toastController`

### Phase 5: Hardware RFID
- Added `ensureConnected()` method to `HardwareRfidService`

### Phase 6: Refactored Itemmaster
- Reduced `itemmaster.page.ts` from 1057 → ~500 lines
- Extracted helpers: `buildProductData()`, `populateFormFromProduct()`, `populateFormFromExcel()`, `showValidationErrors()`, `groupByEancode()`

### Phase 7: Role & Location Pages
- **Role:** List page with search/add/edit/delete + `add-role` page with reactive form
- **Location:** List page with search/add/edit/delete + `add-location` page with reactive form
- Routes added: `add-role`, `add-role/:id`, `add-location/:id`

### Phase 8: Dashboard Real API Data
- Replaced hardcoded "100"/"3000" with live data from `ProductService`, `SaleService`, `StockService`

### Phase 9: Cleanup & Fixes
- **Typos fixed:** `cmfpassword` → `confirmpassword`, `Employess` → `Employees`, `Stock Ttransfer` → `Stock Transfer`, `taging` → `tagging`
- **Commented code removed:** 70+ lines from `app.component.ts`
- **Android SDK upgraded:** `compileSdkVersion`/`targetSdkVersion` 32 → **34**
- **SCSS bug fixed:** `add-role.page.scss` had HTML instead of styles
- **33 type errors fixed:** Service mutation params changed to `any`, casing fixes (`RefOrgid`→`refOrgId`, `SegmentName`→`segmentName`)
- **Route URLs fixed:** `taging` → `tagging`

### Phase 10: Unit Tests
New test files with meaningful tests:
| Test File | Tests |
|-----------|-------|
| `services/auth.service.spec.ts` | Token storage, expiry, login, logout, invalid JSON |
| `interceptors/auth.interceptor.spec.ts` | Bearer token injection, no-token passthrough |
| `interceptors/error.interceptor.spec.ts` | Status 0/401/404/500 toast messages, error re-throw |
| `guards/auth.guard.spec.ts` | Auth check, redirect to login, returnUrl passthrough |
| `services/base.service.spec.ts` | GET/POST/PUT/DELETE URL construction, typed responses |
| `services/toastr/toastr.service.spec.ts` | Success/warning/danger toast colors |
| `login/login.page.spec.ts` | Empty field validation, login success redirect, error toast |

Fixed all 31 pre-existing auto-generated stub spec files (added `HttpClientTestingModule` import).

---

## API Info
- **Base URL:** `https://cloud.neolysi.com/rfidapi/api/`
- **Swagger endpoints:** 61 across 15 tags
- **Auth:** Not yet enforced — scaffolded with interceptors/guard

## Tech Stack
- Ionic 6 + Angular 15 + Capacitor 4
- Zebra RFD4031 UHF RFID
- Chart.js, FontAwesome, xlsx

## Known Issues
- 89 npm vulnerabilities (11 low, 23 moderate, 52 high, 3 critical)
- `find-tag.page.scss` exceeds 2kB CSS budget (2.89kB)
- `@awesome-cordova-plugins/status-bar` still in dependencies
- API has RBAC support (`WindowAccess`) but app doesn't implement it
- `CompanyMaster` page deferred — needs Holding/Location relationship design
