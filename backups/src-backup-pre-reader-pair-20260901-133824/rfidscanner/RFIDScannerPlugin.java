package com.neolysi.rfid.plugins.rfidscanner;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothManager;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(
    name = "RFIDScanner",
    permissions = {
        @Permission(alias = "bluetooth", strings = {
            Manifest.permission.BLUETOOTH,
            Manifest.permission.BLUETOOTH_ADMIN
        }),
        @Permission(alias = "bluetoothConnect", strings = {
            Manifest.permission.BLUETOOTH_CONNECT
        }),
        @Permission(alias = "bluetoothScan", strings = {
            Manifest.permission.BLUETOOTH_SCAN
        }),
        @Permission(alias = "location", strings = {
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
        })
    }
)
public class RFIDScannerPlugin extends Plugin {

    private static final String TAG = "RFIDScanner";
    private static final String EVENT_TAG_READ = "tagRead";
    private static final String EVENT_TAG_DETAILS = "tagDetails";
    private static final String EVENT_CONNECTED = "readerConnected";
    private static final String EVENT_DISCONNECTED = "readerDisconnected";
    private static final String EVENT_PAIRING = "readerPairing";
    private static final String EVENT_PAIRING_COMPLETE = "readerPairingComplete";

    private IRfidDevice device;
    private DeviceDetector.DeviceType deviceType;

    // Single background thread for ALL hardware operations (same pattern as
    // the proven reference plugin): prevents concurrent SDK access from the
    // Capacitor bridge thread racing connect/config work.
    private final ExecutorService taskExecutor = Executors.newSingleThreadExecutor();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    private interface DeviceOp { void run() throws Exception; }

    /** Runs a device operation on the serialized executor; rejects on failure. */
    private void runSerial(PluginCall call, String errorLabel, DeviceOp op) {
        taskExecutor.execute(() -> {
            try {
                op.run();
            } catch (Exception e) {
                String msg = e.getMessage() != null ? e.getMessage() : errorLabel;
                Log.e(TAG, errorLabel + ": " + msg);
                call.reject(msg);
            }
        });
    }

    private final RfidDeviceCallback deviceCallback = new RfidDeviceCallback() {
        @Override
        public void onTagRead(String epc, int rssi, int antennaId) {
            notifyTagRead(epc, rssi, antennaId, -1);
        }

        @Override
        public void onTagReadWithChannel(String epc, int rssi, int antennaId, int channelIndex) {
            notifyTagRead(epc, rssi, antennaId, channelIndex);
        }

        private void notifyTagRead(String epc, int rssi, int antennaId, int channelIndex) {
            JSObject data = new JSObject();
            data.put("epc", epc);
            data.put("rssi", rssi);
            data.put("antennaId", antennaId);
            if (channelIndex >= 0) {
                data.put("channelIndex", channelIndex);
            }
            mainHandler.post(() -> notifyListeners(EVENT_TAG_READ, data));
        }

        @Override
        public void onTagDetails(String epc, String tid, String userMemory) {
            JSObject data = new JSObject();
            data.put("epc", epc);
            data.put("tid", tid == null ? "" : tid);
            data.put("userMemory", userMemory == null ? "" : userMemory);
            mainHandler.post(() -> notifyListeners(EVENT_TAG_DETAILS, data));
        }

        @Override
        public void onConnected(String name) {
            JSObject result = new JSObject();
            result.put("connected", true);
            result.put("name", name);
            mainHandler.post(() -> notifyListeners(EVENT_CONNECTED, result));
        }

        @Override
        public void onDisconnected() {
            mainHandler.post(() -> notifyListeners(EVENT_DISCONNECTED, new JSObject()));
        }

        @Override
        public void onPairingStatus(String status, String message) {
            JSObject s = new JSObject();
            s.put("status", status);
            s.put("message", message);
            mainHandler.post(() -> notifyListeners(EVENT_PAIRING, s));
        }

        @Override
        public void onPairingComplete(String name) {
            JSObject status = new JSObject();
            status.put("status", "paired");
            status.put("name", name);
            status.put("message", "Pairing complete. Connecting...");
            mainHandler.post(() -> notifyListeners(EVENT_PAIRING_COMPLETE, status));
        }
    };

    @Override
    protected void handleOnResume() {
        super.handleOnResume();
        if (device instanceof ZebraRfidDevice) {
            ((ZebraRfidDevice) device).onResume();
        }
    }

    @Override
    protected void handleOnPause() {
        super.handleOnPause();
        if (device instanceof ZebraRfidDevice) {
            ((ZebraRfidDevice) device).onPause();
        }
    }

    // ─── Permission handling ───────────────────────────────────────

    @PluginMethod
    public void connect(PluginCall call) {
        Log.d(TAG, "connect() called");
        ensurePermissions(call, "connectInternal");
    }

    @PluginMethod
    public void pairReader(PluginCall call) {
        Log.d(TAG, "pairReader() called");
        ensurePermissions(call, "pairReaderInternal");
    }

    @PluginMethod
    public void getAvailableReaders(PluginCall call) {
        Log.d(TAG, "getAvailableReaders() called");
        java.util.List<DeviceDetector.ReaderInfo> list = DeviceDetector.listReaders(getContext());
        com.getcapacitor.JSArray arr = new com.getcapacitor.JSArray();
        for (DeviceDetector.ReaderInfo r : list) {
            JSObject o = new JSObject();
            o.put("name", r.name != null ? r.name : "");
            o.put("address", r.address != null ? r.address : "");
            o.put("type", r.type);
            o.put("builtIn", r.builtIn);
            arr.put(o);
        }
        call.resolve(new JSObject().put("readers", arr));
    }

    @PluginMethod
    public void getDiagnosticInfo(PluginCall call) {
        Log.d(TAG, "getDiagnosticInfo() called");
        BluetoothAdapter adapter = getBluetoothAdapter();
        JSObject info = new JSObject();
        info.put("bluetoothEnabled", adapter != null && adapter.isEnabled());
        info.put("sdkVersion", Build.VERSION.SDK_INT);

        // Detect available device
        DeviceDetector.DeviceType detected = DeviceDetector.detect(getContext());
        info.put("detectedDevice", detected.name());

        if (device != null) {
            info.put("activeDevice", device.getDeviceName());
            info.put("readerConnected", device instanceof ZebraRfidDevice ? ((ZebraRfidDevice) device).isConnected() : true);
        } else {
            info.put("activeDevice", "none");
            info.put("readerConnected", false);
        }

        if (adapter != null && adapter.isEnabled()) {
            boolean hasBtConnect = hasRfidPermission(Manifest.permission.BLUETOOTH_CONNECT);
            boolean hasBtScan = hasRfidPermission(Manifest.permission.BLUETOOTH_SCAN);
            boolean hasLocation = hasRfidPermission(Manifest.permission.ACCESS_FINE_LOCATION);
            info.put("bluetoothConnect", hasBtConnect);
            info.put("bluetoothScan", hasBtScan);
            info.put("fineLocation", hasLocation);

            if (device != null) {
                info.put("deviceInfo", device.getDeviceInfo(getContext()));
            }
        }

        call.resolve(info);
    }

    private void ensurePermissions(PluginCall call, String nextStep) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (!hasRfidPermission(Manifest.permission.BLUETOOTH_CONNECT)) {
                requestPermissionForAlias("bluetoothConnect", call, "permStep2_" + nextStep);
                return;
            }
            if (!hasRfidPermission(Manifest.permission.BLUETOOTH_SCAN)) {
                requestPermissionForAlias("bluetoothScan", call, "permStep2_" + nextStep);
                return;
            }
        }
        if (!hasRfidPermission(Manifest.permission.ACCESS_FINE_LOCATION)) {
            requestPermissionForAlias("location", call, "permFinal_" + nextStep);
            return;
        }
        proceedAfterPermissions(call, nextStep);
    }

    @PermissionCallback
    private void permStep2_connectInternal(PluginCall call) { ensurePermissions(call, "connectInternal"); }

    @PermissionCallback
    private void permStep2_pairReaderInternal(PluginCall call) { ensurePermissions(call, "pairReaderInternal"); }

    @PermissionCallback
    private void permFinal_connectInternal(PluginCall call) { proceedAfterPermissions(call, "connectInternal"); }

    @PermissionCallback
    private void permFinal_pairReaderInternal(PluginCall call) { proceedAfterPermissions(call, "pairReaderInternal"); }

    private void proceedAfterPermissions(PluginCall call, String nextStep) {
        switch (nextStep) {
            case "connectInternal": connectInternal(call); break;
            case "pairReaderInternal": pairReaderInternal(call); break;
        }
    }

    private boolean hasRfidPermission(String perm) {
        return ContextCompat.checkSelfPermission(getContext(), perm) == PackageManager.PERMISSION_GRANTED;
    }

    // ─── Core connection (dispatcher) ──────────────────────────────

    private void connectInternal(PluginCall call) {
        // Auto-detect device if not yet created
        if (device == null) {
            autoDetectAndConnect(call);
            return;
        }

        // Already have a device - reconnect
        try {
            device.connect(getContext(), call);
        } catch (Exception e) {
            call.reject("Connect failed: " + e.getMessage());
        }
    }

    private void autoDetectAndConnect(PluginCall call) {
        Log.d(TAG, "Auto-detecting RFID device...");
        deviceType = DeviceDetector.detect(getContext());

        switch (deviceType) {
            case ZEBRA:
                Log.d(TAG, "Detected Zebra reader - creating ZebraRfidDevice");
                device = new ZebraRfidDevice();
                ((ZebraRfidDevice) device).setCallback(deviceCallback);
                break;
            case UROVO:
                Log.d(TAG, "Detected Urovo device - creating UrovoRfidDevice");
                device = new UrovoRfidDevice();
                ((UrovoRfidDevice) device).setCallback(deviceCallback);
                break;
            case NONE:
            default:
                Log.d(TAG, "No RFID device detected");
                call.reject("No RFID device detected. Connect a Zebra RFD4031 or use on a Urovo DT50.");
                return;
        }

        try {
            device.connect(getContext(), call);
        } catch (Exception e) {
            call.reject("Connect failed: " + e.getMessage());
            device = null;
        }
    }

    private void pairReaderInternal(PluginCall call) {
        if (device instanceof ZebraRfidDevice) {
            ((ZebraRfidDevice) device).pairReader(getContext(), call);
        } else {
            // Auto-detect and pair Zebra
            device = new ZebraRfidDevice();
            ((ZebraRfidDevice) device).setCallback(deviceCallback);
            deviceType = DeviceDetector.DeviceType.ZEBRA;
            ((ZebraRfidDevice) device).pairReader(getContext(), call);
        }
    }

    // ─── RFID operation methods (dispatcher) ────────────────────────

    @PluginMethod
    public void disconnect(PluginCall call) {
        if (device == null) {
            call.resolve();
            return;
        }
        final IRfidDevice dev = device;
        runSerial(call, "Disconnect failed", () -> {
            dev.disconnect();
            device = null;
            call.resolve();
        });
    }

    @PluginMethod
    public void startInventory(PluginCall call) {
        if (requireDevice(call)) return;
        final Integer power = call.getInt("power");
        final boolean continuous = Boolean.TRUE.equals(call.getBoolean("continuous"));
        runSerial(call, "Inventory start failed", () -> {
            if (power != null && device.supportsWrite()) {
                device.setPower(power);
            }
            if (continuous) {
                device.startInventoryContinuous();
            } else {
                device.startInventory();
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject status = new JSObject();
        if (device == null) {
            status.put("connected", false);
            status.put("inventoryRunning", false);
        } else if (device instanceof ZebraRfidDevice) {
            ZebraRfidDevice zebra = (ZebraRfidDevice) device;
            status.put("connected", zebra.isConnected());
            status.put("inventoryRunning", zebra.isNativeInventoryRunning());
        } else {
            status.put("connected", true);
            status.put("inventoryRunning", false);
        }
        call.resolve(status);
    }

    @PluginMethod
    public void stopInventory(PluginCall call) {
        if (requireDevice(call)) return;
        runSerial(call, "Inventory stop failed", () -> {
            device.stopInventory();
            call.resolve();
        });
    }

    @PluginMethod
    public void writeEpc(PluginCall call) {
        if (requireDevice(call)) return;
        if (!device.supportsWrite()) {
            call.reject("Write not supported on " + device.getDeviceName());
            return;
        }
        final String epc = call.getString("epc");
        final String targetEpc = call.getString("targetEpc");
        final String accessPassword = call.getString("accessPassword", "0");
        runSerial(call, "EPC write failed", () -> {
            device.writeEpc(epc, targetEpc, accessPassword);
            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);
        });
    }

    @PluginMethod
    public void writeMemory(PluginCall call) {
        if (requireDevice(call)) return;
        if (!device.supportsWrite()) {
            call.reject("Write not supported on " + device.getDeviceName());
            return;
        }
        final String epc = call.getString("epc");
        final String bank = call.getString("bank");
        final String data = call.getString("data");
        final Integer offset = call.getInt("offset");
        final String accessPassword = call.getString("accessPassword", "0");
        runSerial(call, "Memory write failed", () -> {
            device.writeMemory(epc, bank, offset != null ? offset : 0, data, accessPassword);
            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);
        });
    }

    @PluginMethod
    public void readMemory(PluginCall call) {
        if (requireDevice(call)) return;
        final String epc = call.getString("epc");
        final String bank = call.getString("bank");
        final Integer offset = call.getInt("offset");
        final Integer count = call.getInt("count");
        final String accessPassword = call.getString("accessPassword", "0");
        runSerial(call, "Memory read failed", () -> {
            String data = device.readMemory(epc, bank,
                    offset != null ? offset : 0,
                    count != null ? count : 1,
                    accessPassword);
            JSObject result = new JSObject();
            result.put("data", data);
            call.resolve(result);
        });
    }

    @PluginMethod
    public void kill(PluginCall call) {
        if (requireDevice(call)) return;
        if (!device.supportsKill()) {
            call.reject("Kill not supported on " + device.getDeviceName());
            return;
        }
        final String epc = call.getString("epc");
        final String killPassword = call.getString("killPassword", "0");
        runSerial(call, "Kill failed", () -> {
            device.kill(epc, killPassword);
            call.resolve();
        });
    }

    @PluginMethod
    public void setPower(PluginCall call) {
        if (requireDevice(call)) return;
        final Integer power = call.getInt("power");
        if (power == null) { call.reject("power is required"); return; }
        runSerial(call, "Set power failed", () -> {
            device.setPower(power);
            call.resolve();
        });
    }

    @PluginMethod
    public void setBeep(PluginCall call) {
        if (requireDevice(call)) return;
        final Boolean enabled = call.getBoolean("enabled");
        if (enabled == null) { call.reject("enabled is required"); return; }
        runSerial(call, "Set beep failed", () -> {
            device.setBeep(enabled);
            call.resolve();
        });
    }

    // ─── Helpers ────────────────────────────────────────────────────

    private boolean requireDevice(PluginCall call) {
        if (device == null) {
            call.reject("No RFID device connected. Call connect() first.");
            return true;
        }
        return false;
    }

    private BluetoothAdapter getBluetoothAdapter() {
        BluetoothManager btManager = (BluetoothManager) getContext().getSystemService(Context.BLUETOOTH_SERVICE);
        return btManager != null ? btManager.getAdapter() : null;
    }
}
