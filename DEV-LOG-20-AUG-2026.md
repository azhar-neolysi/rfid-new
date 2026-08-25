# Development Log — 20 August 2026

## Summary

Fixed the **"form clears on scan"** bug across all pages by adding `pageActive` lifecycle guards, and added **diagnostic logging** to debug the Urovo DT50 "reader disconnected" issue. Investigated nested JAR issue in Urovo AAR (proven not the root cause).

---

## 1. Form Clears on Scan — FIXED

### Problem
When editing an existing record (e.g., Item Master, RFID Master) and scanning an RFID tag, the entire form would reload as empty. Root cause: Ionic's `ion-router-outlet` keeps background pages alive. Navigation pages (Item List, Tagging, RFID List, Sale) have `tagRead$` subscriptions that call `router.navigate()` even when the page is in the background, pushing new empty page instances over the current edit page.

### Solution — `pageActive` Guard
Added to all 8 pages with `tagRead$` subscriptions:

```typescript
// 1. Add property
pageActive = false;

// 2. Add lifecycle hooks
ionViewDidEnter() {
  this.pageActive = true;
}
ionViewDidLeave() {
  this.pageActive = false;
}

// 3. Guard all tagRead$ callbacks
this.hardwareRfid.tagRead$.subscribe((event) => {
  if (!this.pageActive) return;
  // ... handle tag
});
```

### Pages Fixed
| Page | File | Behavior |
|------|------|----------|
| Item List | `src/app/itemmaster/item-list/item-list.page.ts` | Navigates to itemmaster on scan |
| Tagging | `src/app/taging/taging.page.ts` | Navigates to itemmaster on scan |
| RFID List | `src/app/rfid-master/rfid-list/rfid-list.page.ts` | Navigates to rfidmaster on scan |
| Sale | `src/app/sale/sale/sale.page.ts` | Navigates to sale-entry on scan |
| Item Master | `src/app/itemmaster/itemmaster/itemmaster.page.ts` | Sets rfidcode field on scan |
| RFID Master | `src/app/rfid-master/rfid-master/rfid-master.page.ts` | Sets tagID field on scan |
| Stock Transfer | `src/app/stock-transfer/stock-transfer/stock-transfer.page.ts` | Sets barcode field on scan |
| Find Tag | `src/app/find-tag/find-tag.page.ts` | Accumulates scannedTags |

---

## 2. Urovo DT50 "Reader Disconnected" — Investigation

### Current State
Urovo DT50 shows "reader disconnected" (red dot in sidebar). Zebra RFD4031 works fine.

### What Was Investigated

#### Nested JAR Theory (DISPROVED)
The Urovo AAR (`USDKLibrary-v2.3.0509.aar`) contains nested JARs:
```
USDKLibrary-v2.3.0509.aar
├── classes.jar              ← USDKManager, RfidManager, IRfidCallback, etc.
├── libs/
│   ├── rfiddriver.jar       ← com.rfid.trans.*, com.rfid.serialport.*
│   └── rfidV2.1.jar         ← com.rfid.trans.CReader, ReaderParameter
└── jni/
    └── libserial_port.so
```

We tried extracting the nested JARs to `android/app/libs/` but got **duplicate class errors** — proving the classes are ALREADY inside the AAR's root `classes.jar`. The nested JARs are redundant copies.

#### What's Been Added — Diagnostic Logging

**`DeviceDetector.java`** — Now logs exact `Build.MANUFACTURER`, `Build.MODEL`, `Build.DEVICE`:
```
detect() - Manufacturer: [...], Model: [...], Device: [...]
```

**`UrovoRfidDevice.java`** — Now logs:
- `USDKManager.getInstance()` null check
- `USDKManager.init()` callback status (SUCCESS or failure code)
- `NoClassDefFoundError` catch for missing dependencies
- General exception catch

### Next Steps (FOR TOMORROW)
1. **Install the APK on Urovo DT50**
2. **Run logcat** to see diagnostic output:
   ```bash
   adb logcat -s DeviceDetector:* UrovoRfidDevice:* RFIDScanner:*
   ```
3. **Look for these log lines:**
   - `detect() - Manufacturer: [...], Model: [...]` → check if manufacturer/model contains "urovo"/"dt50"
   - `USDKManager.init() callback - status: ...` → check the exact status code
   - `NoClassDefFoundError` → missing class
   - `Exception during Urovo connect` → other error
4. **Based on findings:**
   - If detection fails → add correct manufacturer/model to `DeviceDetector.isUrovoDevice()`
   - If USDKManager init fails → check Urovo SDK docs for required permissions/setup
   - If permissions missing → add to AndroidManifest.xml

---

## 3. Architecture Reference

### Plugin Architecture (Factory Pattern)
```
RFIDScannerPlugin.java (thin dispatcher, ~420 lines)
├── IRfidDevice.java (interface)
├── DeviceDetector.java (auto-detect Zebra vs Urovo)
├── RfidDeviceCallback.java (event callback interface)
├── ZebraRfidDevice.java (Zebra RFD4031 Bluetooth)
└── UrovoRfidDevice.java (Urovo DT50 built-in SDK)
```

### Connection Flow
```
app.component.ts → platform.ready() → hardwareRfid.connect()
  → RFIDScanner.connect() [Capacitor native]
    → RFIDScannerPlugin.connect()
      → ensurePermissions() → connectInternal()
        → autoDetectAndConnect()
          → DeviceDetector.detect()
            → isUrovoDevice() → Build.MANUFACTURER/MODEL check
            → isZebraAvailable() → Bluetooth bonded devices check
          → new UrovoRfidDevice() or new ZebraRfidDevice()
          → device.connect(context, call)
```

### Angular Service
```
HardwareRfidService (device-agnostic)
├── tagRead$ → Subject<TagReadEvent>
├── connected$ → Subject<string | undefined>
├── disconnected$ → Subject<string | undefined>
├── connect() → RFIDScanner.connect() → startInventory()
├── startInventory() → RFIDScanner.startInventory()
└── stopInventory() → RFIDScanner.stopInventory()
```

---

## 4. Build Commands

### Angular Build
```bash
cd "E:\Neo RFID\rfid"
npx ng build --configuration production
```

### Sync www to Android
```bash
robocopy "E:\Neo RFID\rfid\www" "E:\Neo RFID\rfid\android\app\src\main\assets\public" /MIR
```

### Android APK Build
```bash
$env:ANDROID_HOME = "C:\Users\hp\AppData\Local\Android\Sdk"
& "E:\Neo RFID\rfid\android\gradlew.bat" -p "E:\Neo RFID\rfid\android" assembleDebug
```

### Copy APK
```bash
Copy-Item "E:\Neo RFID\rfid\android\app\build\outputs\apk\debug\app-debug.apk" "E:\Neo RFID\app-debug.apk"
```

---

## 5. Backups Taken Today

| Time | Location | Description |
|------|----------|-------------|
| Before page-active fix | `E:\Neo RFID\rfid 20-08-2026-1700` | Before adding pageActive guards |
| Before Urovo fix | `E:\Neo RFID\rfid 20-08-2026-1840` | Before Urovo diagnostic logging |

---

## 6. Known Issues & TODO

| Issue | Status | Notes |
|-------|--------|-------|
| Urovo DT50 shows "reader disconnected" | **ACTIVE** | Need logcat output to diagnose |
| Reader status indicators (green/red dot) | **DONE** | Added to all 8 pages |
| Single-tap detection (Zebra) | **DONE** | 300ms threshold, re-arms trigger |
| Zebra STOP_TRIGGER_TYPE | **DONE** | Changed to HANDHELD_WITH_TIMEOUT |
| Angular→Android sync required | **KNOWN** | After ng build, must copy www/ to android assets |

---

## 7. Key File Paths

| File | Purpose |
|------|---------|
| `android/app/src/main/java/com/neolysi/rfid/plugins/rfidscanner/RFIDScannerPlugin.java` | Capacitor plugin dispatcher |
| `android/app/src/main/java/com/neolysi/rfid/plugins/rfidscanner/DeviceDetector.java` | Auto-detect Zebra/Urovo |
| `android/app/src/main/java/com/neolysi/rfid/plugins/rfidscanner/UrovoRfidDevice.java` | Urovo DT50 SDK implementation |
| `android/app/src/main/java/com/neolysi/rfid/plugins/rfidscanner/ZebraRfidDevice.java` | Zebra RFD4031 implementation |
| `src/app/services/hardware-rfid.service.ts` | Angular RFID service |
| `src/app/services/rfid-scanner.models.ts` | TypeScript plugin interface |
| `android/app/libs/USDKLibrary-v2.3.0509.aar` | Urovo native SDK |
| `android/app/libs/rfidapi3lib-2.0.5.275.aar` | Zebra native SDK |

## 8. Environment Notes

- **C: drive has ~0.2GB free** — Android Studio cannot open; all builds via command line
- **ANDROID_HOME** env var incorrectly points to `D:\`; actual SDK at `C:\Users\hp\AppData\Local\Android\Sdk`
- **Git remote:** `https://github.com/azhar-neolysi/rfid-new.git`
- **Brand colors:** navy `#011644`, red `#ff2800`
