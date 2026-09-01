# Web Dashboard vs Mobile App — Feature Split Plan

**App:** RFID Inventory (Ionic/Angular/Capacitor, `com.neolysi.rfid`)
**Backend:** `https://cloud.neolysi.com/rfidapi/` (REST + JWT auth)
**Date:** 2026-08-31

---

## Summary Perspective

This is a **hybrid ERP + RFID hardware app**. Anything that touches the RFID reader
hardware must stay on mobile; pure data-entry/master-management belongs on a web
dashboard. Features with backward/hybrid use fall in between.

---

## 🟢 A. Move to Web Dashboard (Pure ERP — no hardware)

These are CRUD / master / report / dashboard screens with **zero RFID / barcode /
hardware dependency** and are best used with a mouse & keyboard on a desktop.

| Menu / Feature | Route | Notes |
|---|---|---|
| Dashboard (KPIs) | `/dashboard` | product/sale/transfer counts + charts — ideal web |
| Company Master | `/companymaster` | (placeholder) |
| Location (CRUD) | `/location` | warehouse/office addresses |
| Reference (categories) | `/reference` | |
| Reference List (items) | `/reference-list` | |
| Role (CRUD) | `/role` | |
| Employees (CRUD) | `/employee` | + auto user creation |
| Segment | `/segment`, `/add-segment` | product attributes |
| Users | `/users` | (placeholder) |
| Reports | `/currentstockreport`, `/dispatchreport` | (placeholders, but reports = web-first) |
| Stock Transfer **List** | `/stock-transfer-list` | viewing history is web |
| Sale **List** / reports | sale history | web |
| Login | `/login` | shared |

**Why:** All pure backend REST CRUD. Desktop is better for master-data entry, bulk
viewing, and reporting. No RFID reader present on a desktop.

---

## 🔴 B. Keep in Mobile App (Hardware-dependent / field-use only)

These **require the RFID reader (Bluetooth) or physical scanning** and make no sense
on a desktop without hardware.

| Feature | Route | Why mobile |
|---|---|---|
| **Tag Count** | `/tag-count` | Live inventory scanning via reader — core field op |
| **Tag Locator** | `/tag-locator` | Proximity finder + haptic vibration |
| **Readers** (Bluetooth manager) | `/readers` | Connect/switch physical readers |
| **RFID Master** (register tags) | `/rfidmaster`, `/rfid-list` | Scans TID / user memory from physical tags |
| **Tagging** (map product→tag) | `/tagging` | Scan tag/barcode to assign |
| **Find Tag** (offline diff) | `/find-tag` | Field-side picked list comparison |

**Why:** All depend on `HardwareRfidService` (Bluetooth Zebra/Urovo reader) and/or
the native barcode camera. Impossible / pointless in a web browser.

---

## 🟡 C. Hybrid — Keep scan input on Mobile, full editing on Web

These are ERP forms **enhanced by RFID/barcode scanning**, but their underlying data
management also belongs on web.

| Feature | Mobile role | Web role |
|---|---|---|
| **Product Entry** (`/item-list`, `/itemmaster`) | Scan to look up / jump to a product; assign tag via scan | Full product CRUD, bulk edit, mass tag assignment |
| **Sale** (`/sale`, `/sale-entry`) | Scan RFID/barcode at POS / counter to identify & bill fast | Sale history, returns, reporting, analytics |
| **Stock Transfer** (`/stock-transfer`) | Scan to identify product during physical transfer | Transfer planning, history, approval |

**Recommended split:** Build the **web version** for master / reporting / analytics
side, and keep the **mobile scan photo** as the primary input path in the field. Data
writes sync via the shared REST API.

---

## Recommended Phased Approach

### Phase 1 — Web Dashboard (pure ERP) — highest ROI, no hardware complexity
Move everything in **Group A (🟢)** to a web app consuming the same REST API. The
mobile app keeps only Groups B + C. This gives a desktop console for masters, reports,
and KPIs.

**Key work:** Rebuild these as a responsive web (Angular) SPA (or extend the same
codebase with a `platform` guard); port the REST service layer + JWT auth; remove
Capacitor / native plugin dependencies for web.

### Phase 2 — Data analytics & reports (web-first)
Build out real reporting (current stock, dispatch, sale analytics) on web, since those
pages are only stubs. This is where dashboards shine.

### Phase 3 — Keep / optimize mobile for the field
- Keep Group B (hardware) + Group C (scan input) lean and offline-tolerant.
- Device Master is on mobile already (per-device config) — keep it.

---

## Key Architectural Questions (before committing)

1. **Reuse the same Angular codebase** or **build a separate web SPA**?
   (Reuse = share services/models but split by an `isNative` / platform guard;
   separate = cleaner but duplicates CRUD code.)
2. **Data direction** — should mobile write instantly to the cloud API (current model),
   or support **offline queues** that sync later (field locations often lack internet)?
3. **Which screens are actually used in the field on mobile** vs only used from an
   office computer? (Determines real Group A vs C membership — e.g., is Sale /
   Stock-Transfer done on the handheld, or office-only?)
4. **Reports scope** — are reports web-only, or do store managers need them on the
   handheld too?

---

## Status
- [x] Analysis of all 27 modules (hardware vs ERP vs hybrid)
- [ ] Confirm Group A / B / C membership with stakeholders (Q3 above)
- [ ] Decide web platform approach (Q1 above)
- [ ] Decide sync / offline model (Q2 above)
