package com.neolysi.rfid.plugins.rfidscanner;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothProfile;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
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
import com.zebra.rfid.api3.ACCESS_OPERATION_STATUS;
import com.zebra.rfid.api3.AntennaInfo;
import com.zebra.rfid.api3.Antennas;
import com.zebra.rfid.api3.ENUM_TRANSPORT;
import com.zebra.rfid.api3.MEMORY_BANK;
import com.zebra.rfid.api3.RFIDReader;
import com.zebra.rfid.api3.ReaderDevice;
import com.zebra.rfid.api3.Readers;
import com.zebra.rfid.api3.RfidEventsListener;
import com.zebra.rfid.api3.RfidReadEvents;
import com.zebra.rfid.api3.RfidStatusEvents;
import com.zebra.rfid.api3.START_TRIGGER_TYPE;
import com.zebra.rfid.api3.STOP_TRIGGER_TYPE;
import com.zebra.rfid.api3.STATUS_EVENT_TYPE;
import com.zebra.rfid.api3.TagAccess;
import com.zebra.rfid.api3.TagData;
import com.zebra.rfid.api3.TriggerInfo;

import java.util.ArrayList;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

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
public class RFIDScannerPlugin extends Plugin implements Readers.RFIDReaderEventHandler {

    private static final String TAG = "RFIDScanner";
    private static final String EVENT_TAG_READ = "tagRead";
    private static final String EVENT_CONNECTED = "readerConnected";
    private static final String EVENT_DISCONNECTED = "readerDisconnected";
    private static final String EVENT_PAIRING = "readerPairing";
    private static final String EVENT_PAIRING_COMPLETE = "readerPairingComplete";
    private static final int MAX_TX_POWER_DBM = 30;
    private static final long DISCOVERY_TIMEOUT_MS = 45_000;
    private static final String RFD_NAME_PATTERN = "RFD40";

    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final AtomicBoolean connected = new AtomicBoolean(false);

    private Readers readers;
    private RFIDReader reader;

    private BroadcastReceiver discoveryReceiver;
    private BroadcastReceiver bondReceiver;
    private BluetoothAdapter bluetoothAdapter;
    private volatile boolean pairingInProgress = false;

    private final RfidEventsListener rfidListener = new RfidEventsListener() {
        @Override
        public void eventReadNotify(RfidReadEvents rfidReadEvents) {
            try {
                if (reader == null) return;
                TagData[] tags = reader.Actions.getReadTags(100);
                if (tags == null) return;
                for (TagData tag : tags) {
                    if (tag == null || tag.getTagID() == null || tag.getTagID().isEmpty()) continue;
                    JSObject data = new JSObject();
                    data.put("epc", tag.getTagID());
                    data.put("rssi", (int) tag.getPeakRSSI());
                    data.put("antennaId", (int) tag.getAntennaID());
                    mainHandler.post(() -> notifyListeners(EVENT_TAG_READ, data));
                }
            } catch (Exception e) {
                Log.e(TAG, "Error in eventReadNotify", e);
            }
        }

        @Override
        public void eventStatusNotify(RfidStatusEvents rfidStatusEvents) {
            if (rfidStatusEvents == null || rfidStatusEvents.StatusEventData == null) return;
            if (rfidStatusEvents.StatusEventData.getStatusEventType() == STATUS_EVENT_TYPE.DISCONNECTION_EVENT) {
                if (reader != null && reader.isConnected()) {
                    Log.w(TAG, "Spurious disconnect event received but reader is still connected, ignoring");
                    return;
                }
                Log.w(TAG, "Reader disconnected event received");
                connected.set(false);
                mainHandler.post(() -> notifyListeners(EVENT_DISCONNECTED, new JSObject()));
            }
        }
    };

    @Override
    public void RFIDReaderAppeared(ReaderDevice readerDevice) {
        Log.d(TAG, "RFIDReaderAppeared: " + (readerDevice != null ? readerDevice.getName() : "null"));
    }

    @Override
    public void RFIDReaderDisappeared(ReaderDevice readerDevice) {
        Log.d(TAG, "RFIDReaderDisappeared: " + (readerDevice != null ? readerDevice.getName() : "null"));
        if (readerDevice == null || readerDevice.getName() == null || reader == null) return;
        try {
            if (readerDevice.getName().equals(reader.getHostName())) {
                if (reader.isConnected()) {
                    Log.w(TAG, "Spurious RFIDReaderDisappeared but reader is still connected, ignoring");
                    return;
                }
                connected.set(false);
                mainHandler.post(() -> notifyListeners(EVENT_DISCONNECTED, new JSObject()));
            }
        } catch (Exception ignored) {}
    }

    @Override
    protected void handleOnResume() {
        super.handleOnResume();
        reRegisterBondReceiver();
    }

    @Override
    protected void handleOnPause() {
        super.handleOnPause();
        unregisterBondReceiver();
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
    public void getDiagnosticInfo(PluginCall call) {
        Log.d(TAG, "getDiagnosticInfo() called");
        BluetoothAdapter adapter = getBluetoothAdapter();
        JSObject info = new JSObject();
        info.put("bluetoothEnabled", adapter != null && adapter.isEnabled());
        info.put("sdkVersion", Build.VERSION.SDK_INT);

        if (adapter != null && adapter.isEnabled()) {
            boolean hasBtConnect = hasRfidPermission(Manifest.permission.BLUETOOTH_CONNECT);
            boolean hasBtScan = hasRfidPermission(Manifest.permission.BLUETOOTH_SCAN);
            boolean hasLocation = hasRfidPermission(Manifest.permission.ACCESS_FINE_LOCATION);
            info.put("bluetoothConnect", hasBtConnect);
            info.put("bluetoothScan", hasBtScan);
            info.put("fineLocation", hasLocation);

            if (hasBtConnect) {
                try {
                    Set<BluetoothDevice> bonded = adapter.getBondedDevices();
                    int count = bonded != null ? bonded.size() : 0;
                    info.put("bondedDeviceCount", count);
                    ArrayList<String> bondedNames = new ArrayList<>();
                    if (bonded != null) {
                        for (BluetoothDevice d : bonded) {
                            String n = d.getName();
                            if (n != null) bondedNames.add(n + " [" + d.getAddress() + "]");
                        }
                    }
                    info.put("bondedDevices", bondedNames.toString());
                } catch (SecurityException e) {
                    info.put("bondedDevices", "SecurityException: " + e.getMessage());
                }
            }

            info.put("readerConnected", connected.get());
            info.put("readersSdkInitialized", readers != null);
            info.put("pairingInProgress", pairingInProgress);
        }

        call.resolve(info);
    }

    private void ensurePermissions(PluginCall call, String nextStep) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (!hasRfidPermission(Manifest.permission.BLUETOOTH_CONNECT)) {
                Log.d(TAG, "Requesting BLUETOOTH_CONNECT");
                requestPermissionForAlias("bluetoothConnect", call, "permStep2_" + nextStep);
                return;
            }
            if (!hasRfidPermission(Manifest.permission.BLUETOOTH_SCAN)) {
                Log.d(TAG, "Requesting BLUETOOTH_SCAN");
                requestPermissionForAlias("bluetoothScan", call, "permStep2_" + nextStep);
                return;
            }
        }
        if (!hasRfidPermission(Manifest.permission.ACCESS_FINE_LOCATION)) {
            Log.d(TAG, "Requesting ACCESS_FINE_LOCATION");
            requestPermissionForAlias("location", call, "permFinal_" + nextStep);
            return;
        }
        proceedAfterPermissions(call, nextStep);
    }

    @PermissionCallback
    private void permStep2_connectInternal(PluginCall call) {
        ensurePermissions(call, "connectInternal");
    }

    @PermissionCallback
    private void permStep2_pairReaderInternal(PluginCall call) {
        ensurePermissions(call, "pairReaderInternal");
    }

    @PermissionCallback
    private void permFinal_connectInternal(PluginCall call) {
        proceedAfterPermissions(call, "connectInternal");
    }

    @PermissionCallback
    private void permFinal_pairReaderInternal(PluginCall call) {
        proceedAfterPermissions(call, "pairReaderInternal");
    }

    private void proceedAfterPermissions(PluginCall call, String nextStep) {
        switch (nextStep) {
            case "connectInternal":
                connectInternal(call);
                break;
            case "pairReaderInternal":
                pairReaderInternal(call);
                break;
        }
    }

    private boolean hasRfidPermission(String perm) {
        return ContextCompat.checkSelfPermission(getContext(), perm) == PackageManager.PERMISSION_GRANTED;
    }

    // ─── Core connection ───────────────────────────────────────────

    private void connectInternal(PluginCall call) {
        Log.d(TAG, "connectInternal() - starting Zebra SDK connection flow");
        boolean bt = call.getBoolean("bt", true);
        boolean usb = call.getBoolean("usb", true);
        String btName = call.getString("btName");

        executor.execute(() -> {
            try {
                Log.d(TAG, "Creating Readers SDK (BT transport)");
                if (readers == null) {
                    readers = new Readers(getContext(), ENUM_TRANSPORT.BLUETOOTH);
                }
                Readers.attach(this);

                ReaderDevice candidate = null;

                // Try Zebra SDK discovery (only works for already-bonded devices)
                if (bt) {
                    candidate = safeFindReader(ENUM_TRANSPORT.BLUETOOTH, btName, "BT");
                }
                if (candidate == null && usb) {
                    candidate = safeFindReader(ENUM_TRANSPORT.SERVICE_USB, btName, "USB");
                }
                if (candidate == null && usb) {
                    candidate = safeFindReader(ENUM_TRANSPORT.SERVICE_SERIAL, btName, "Serial");
                }

                if (candidate != null) {
                    Log.d(TAG, "Found reader via SDK: " + candidate.getName());
                    connectToReaderDevice(call, candidate);
                } else {
                    Log.d(TAG, "SDK found no readers. Trying OS-level discovery + bonding...");
                    attemptOsDiscoveryAndConnect(call, btName);
                }
            } catch (Exception e) {
                Log.e(TAG, "Unexpected error in connectInternal", e);
                call.reject("Connection error: " + (e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()));
            }
        });
    }

    private ReaderDevice safeFindReader(ENUM_TRANSPORT transport, String btName, String label) {
        try {
            readers.setTransport(transport);
            ArrayList<ReaderDevice> list = readers.GetAvailableRFIDReaderList();
            Log.d(TAG, label + " findReader: " + (list != null ? list.size() : 0) + " devices");
            if (list == null || list.isEmpty()) return null;
            if (btName == null || btName.isEmpty()) return list.get(0);
            for (ReaderDevice d : list) {
                if (d.getName() != null && d.getName().equalsIgnoreCase(btName)) return d;
            }
            return null;
        } catch (Exception e) {
            Log.w(TAG, label + " findReader exception: " + e.getMessage());
            return null;
        }
    }

    private void connectToReaderDevice(PluginCall call, ReaderDevice candidate) throws Exception {
        reader = candidate.getRFIDReader();
        if (reader == null) {
            call.reject("Reader device did not expose an RFID reader.");
            return;
        }
        if (!reader.isConnected()) {
            Log.d(TAG, "Connecting to reader: " + candidate.getName());
            reader.connect();
        }
        configureReader();
        connected.set(true);
        final String name = candidate.getName();
        Log.d(TAG, "Connected to: " + name);
        mainHandler.post(() -> {
            JSObject result = new JSObject();
            result.put("connected", true);
            result.put("name", name != null ? name : "RFD4031");
            call.resolve(result);
            notifyListeners(EVENT_CONNECTED, result);
        });
    }

    // ─── OS-level discovery + bonding ──────────────────────────────

    private void attemptOsDiscoveryAndConnect(PluginCall call, String btName) {
        BluetoothAdapter adapter = getBluetoothAdapter();
        if (adapter == null || !adapter.isEnabled()) {
            Log.e(TAG, "Bluetooth adapter null or disabled");
            call.reject("Bluetooth is not enabled. Please enable Bluetooth and try again.");
            return;
        }

        if (!hasRfidPermission(Manifest.permission.BLUETOOTH_CONNECT)) {
            call.reject("BLUETOOTH_CONNECT permission not granted.");
            return;
        }

        // First: check if device is already bonded but SDK missed it
        BluetoothDevice bondedDevice = findBondedRfdDevice(adapter, btName);
        if (bondedDevice != null) {
            Log.d(TAG, "Found bonded RFD device: " + bondedDevice.getName() + " [" + bondedDevice.getAddress() + "]");
            refreshSdkAndConnect(call, bondedDevice.getName());
            return;
        }

        Log.d(TAG, "No bonded RFD found. Starting discovery...");
        pairingInProgress = true;
        emitPairing("scanning", "Searching for RFD4031 reader...");
        startDiscoveryAndBond(adapter, call);
    }

    private void pairReaderInternal(PluginCall call) {
        Log.d(TAG, "pairReaderInternal() started");
        if (pairingInProgress) {
            call.reject("Pairing already in progress");
            return;
        }

        BluetoothAdapter adapter = getBluetoothAdapter();
        if (adapter == null || !adapter.isEnabled()) {
            call.reject("Bluetooth is not enabled. Please enable Bluetooth and try again.");
            return;
        }

        // Check if already bonded
        BluetoothDevice bondedDevice = findBondedRfdDevice(adapter, null);
        if (bondedDevice != null) {
            Log.d(TAG, "RFD already bonded: " + bondedDevice.getName());
            pairingInProgress = false;
            JSObject result = new JSObject();
            result.put("paired", true);
            result.put("name", bondedDevice.getName());
            call.resolve(result);
            return;
        }

        pairingInProgress = true;
        emitPairing("scanning", "Searching for RFD4031 reader...");
        startDiscoveryAndBond(adapter, call);
    }

    private BluetoothDevice findBondedRfdDevice(BluetoothAdapter adapter, String btName) {
        if (!hasRfidPermission(Manifest.permission.BLUETOOTH_CONNECT)) return null;
        try {
            Set<BluetoothDevice> bondedDevices = adapter.getBondedDevices();
            if (bondedDevices == null) return null;
            Log.d(TAG, "Checking " + bondedDevices.size() + " bonded devices for RFD");
            for (BluetoothDevice device : bondedDevices) {
                String name = device.getName();
                if (name == null) continue;
                Log.d(TAG, "  Bonded: " + name + " [" + device.getAddress() + "]");
                if (name.toUpperCase(Locale.US).contains(RFD_NAME_PATTERN)) {
                    if (btName == null || btName.isEmpty() || name.equalsIgnoreCase(btName)) {
                        return device;
                    }
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error listing bonded devices", e);
        }
        return null;
    }

    private void refreshSdkAndConnect(PluginCall call, String deviceName) {
        Log.d(TAG, "refreshSdkAndConnect for: " + deviceName);
        executor.execute(() -> {
            try {
                disposeReaders();
                readers = new Readers(getContext(), ENUM_TRANSPORT.BLUETOOTH);
                Readers.attach(this);

                Thread.sleep(1000);

                ReaderDevice candidate = safeFindReader(ENUM_TRANSPORT.BLUETOOTH, null, "BT-refresh");
                if (candidate == null) {
                    Log.w(TAG, "SDK still can't find bonded device. Trying direct connect.");
                    // Last resort: try to connect directly via BluetoothAdapter
                    BluetoothAdapter adapter = getBluetoothAdapter();
                    if (adapter != null && hasRfidPermission(Manifest.permission.BLUETOOTH_CONNECT)) {
                        BluetoothDevice btDevice = findBondedRfdDevice(adapter, deviceName);
                        if (btDevice != null) {
                            // Try SDK one more time with explicit name
                            candidate = safeFindReader(ENUM_TRANSPORT.BLUETOOTH, deviceName, "BT-byName");
                        }
                    }
                }

                if (candidate == null) {
                    call.reject("Reader paired but SDK cannot find it. Please restart the app.");
                    return;
                }

                connectToReaderDevice(call, candidate);
            } catch (Exception e) {
                Log.e(TAG, "Error in refreshSdkAndConnect", e);
                call.reject("Connection failed after pairing: " + e.getMessage());
            }
        });
    }

    private void startDiscoveryAndBond(BluetoothAdapter adapter, PluginCall call) {
        final BluetoothDevice[] foundDevice = {null};
        final boolean[] finished = {false};

        cleanupReceivers();

        // Discovery receiver
        discoveryReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (!BluetoothDevice.ACTION_FOUND.equals(intent.getAction())) return;
                BluetoothDevice device = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
                if (device == null || device.getName() == null) return;

                String name = device.getName();
                Log.d(TAG, "BT Discovery found: " + name + " [" + device.getAddress() + "]");

                if (name.toUpperCase(Locale.US).contains(RFD_NAME_PATTERN) && foundDevice[0] == null) {
                    foundDevice[0] = device;
                    Log.d(TAG, "Matched RFD device! Starting bond...");
                    emitPairing("found", "Found " + name + ". Pairing...");

                    try {
                        adapter.cancelDiscovery();
                    } catch (Exception e) {
                        Log.w(TAG, "cancelDiscovery error: " + e.getMessage());
                    }

                    try {
                        boolean result = device.createBond();
                        Log.d(TAG, "createBond() returned: " + result);
                        if (!result) {
                            cleanupReceivers();
                            pairingInProgress = false;
                            call.reject("Failed to start pairing. Try pairing in Android Bluetooth settings.");
                        }
                    } catch (Exception e) {
                        Log.e(TAG, "createBond() failed", e);
                        cleanupReceivers();
                        pairingInProgress = false;
                        call.reject("Pairing error: " + e.getMessage());
                    }
                }
            }
        };

        // Bond state receiver
        bondReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (!BluetoothDevice.ACTION_BOND_STATE_CHANGED.equals(intent.getAction())) return;

                int bondState = intent.getIntExtra(BluetoothDevice.EXTRA_BOND_STATE, BluetoothDevice.BOND_NONE);
                int prevBondState = intent.getIntExtra(BluetoothDevice.EXTRA_PREVIOUS_BOND_STATE, BluetoothDevice.BOND_NONE);
                BluetoothDevice device = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
                if (device == null) return;

                String name = device.getName() != null ? device.getName() : device.getAddress();
                Log.d(TAG, "Bond state: " + prevBondState + " -> " + bondState + " for " + name);

                if (bondState == BluetoothDevice.BOND_BONDED && !finished[0]) {
                    finished[0] = true;
                    Log.d(TAG, "Bonding complete! Cleaning up receivers and connecting...");
                    cleanupReceivers();
                    pairingInProgress = false;

                    mainHandler.post(() -> {
                        JSObject status = new JSObject();
                        status.put("status", "paired");
                        status.put("name", name);
                        status.put("message", "Pairing complete. Connecting...");
                        notifyListeners(EVENT_PAIRING_COMPLETE, status);
                    });

                    // Determine if this was called from connect() or pairReader()
                    if (call.getMethodName().equals("pairReader")) {
                        JSObject result = new JSObject();
                        result.put("paired", true);
                        result.put("name", name);
                        call.resolve(result);
                    } else {
                        refreshSdkAndConnect(call, name);
                    }
                } else if (bondState == BluetoothDevice.BOND_NONE && foundDevice[0] != null && !finished[0]) {
                    finished[0] = true;
                    Log.w(TAG, "Bonding failed/rejected");
                    cleanupReceivers();
                    pairingInProgress = false;
                    call.reject("Pairing was rejected. Please pair the RFD4031 in Android Bluetooth settings first.");
                }
            }
        };

        // Register receivers — use RECEIVER_EXPORTED for system Bluetooth broadcasts
        try {
            IntentFilter discoveryFilter = new IntentFilter(BluetoothDevice.ACTION_FOUND);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                getContext().registerReceiver(discoveryReceiver, discoveryFilter, Context.RECEIVER_EXPORTED);
            } else {
                getContext().registerReceiver(discoveryReceiver, discoveryFilter);
            }

            IntentFilter bondFilter = new IntentFilter(BluetoothDevice.ACTION_BOND_STATE_CHANGED);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                getContext().registerReceiver(bondReceiver, bondFilter, Context.RECEIVER_EXPORTED);
            } else {
                getContext().registerReceiver(bondReceiver, bondFilter);
            }
            Log.d(TAG, "Broadcast receivers registered. Starting discovery...");
        } catch (Exception e) {
            Log.e(TAG, "Failed to register receivers", e);
            pairingInProgress = false;
            call.reject("Failed to register Bluetooth receivers: " + e.getMessage());
            return;
        }

        boolean started = adapter.startDiscovery();
        Log.d(TAG, "startDiscovery() returned: " + started);

        // Timeout
        mainHandler.postDelayed(() -> {
            if (!finished[0]) {
                Log.w(TAG, "Discovery timed out after " + (DISCOVERY_TIMEOUT_MS / 1000) + "s");
                cleanupReceivers();
                pairingInProgress = false;
                call.reject(
                    "No RFD4031 found after " + (DISCOVERY_TIMEOUT_MS / 1000) + " seconds. " +
                    "1. Ensure the reader is powered on. " +
                    "2. Ensure Bluetooth LED is blinking amber (pairing mode). " +
                    "3. Hold the phone close to the reader. " +
                    "4. Try pairing manually in Android Bluetooth settings."
                );
            }
        }, DISCOVERY_TIMEOUT_MS);
    }

    // ─── Helpers ───────────────────────────────────────────────────

    private void emitPairing(String status, String message) {
        mainHandler.post(() -> {
            JSObject s = new JSObject();
            s.put("status", status);
            s.put("message", message);
            notifyListeners(EVENT_PAIRING, s);
        });
    }

    private void cleanupReceivers() {
        if (discoveryReceiver != null) {
            try { getContext().unregisterReceiver(discoveryReceiver); } catch (Exception ignored) {}
            discoveryReceiver = null;
        }
        if (bondReceiver != null) {
            try { getContext().unregisterReceiver(bondReceiver); } catch (Exception ignored) {}
            bondReceiver = null;
        }
        BluetoothAdapter adapter = getBluetoothAdapter();
        if (adapter != null) {
            try { adapter.cancelDiscovery(); } catch (Exception ignored) {}
        }
    }

    private void reRegisterBondReceiver() {
        if (pairingInProgress && bondReceiver != null) {
            try {
                IntentFilter f = new IntentFilter(BluetoothDevice.ACTION_BOND_STATE_CHANGED);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    getContext().registerReceiver(bondReceiver, f, Context.RECEIVER_EXPORTED);
                } else {
                    getContext().registerReceiver(bondReceiver, f);
                }
            } catch (Exception ignored) {}
        }
    }

    private void unregisterBondReceiver() {
        if (bondReceiver != null) {
            try { getContext().unregisterReceiver(bondReceiver); } catch (Exception ignored) {}
        }
    }

    private void disposeReaders() {
        if (readers != null) {
            try {
                Readers.deattach(this);
                readers.Dispose();
            } catch (Exception ignored) {}
            readers = null;
        }
    }

    private BluetoothAdapter getBluetoothAdapter() {
        if (bluetoothAdapter != null) return bluetoothAdapter;
        BluetoothManager btManager = (BluetoothManager) getContext().getSystemService(Context.BLUETOOTH_SERVICE);
        if (btManager != null) bluetoothAdapter = btManager.getAdapter();
        return bluetoothAdapter;
    }

    private void configureReader() throws Exception {
        if (reader == null || !reader.isConnected()) return;
        TriggerInfo triggerInfo = new TriggerInfo();
        triggerInfo.StartTrigger.setTriggerType(START_TRIGGER_TYPE.START_TRIGGER_TYPE_HANDHELD);
        triggerInfo.StopTrigger.setTriggerType(STOP_TRIGGER_TYPE.STOP_TRIGGER_TYPE_IMMEDIATE);
        reader.Events.addEventsListener(rfidListener);
        reader.Events.setTagReadEvent(true);
        reader.Events.setAttachTagDataWithReadEvent(false);
        reader.Events.setHandheldEvent(true);
        reader.Events.setReaderDisconnectEvent(true);
        reader.Config.setStartTrigger(triggerInfo.StartTrigger);
        reader.Config.setStopTrigger(triggerInfo.StopTrigger);
    }

    // ─── Plugin methods ────────────────────────────────────────────

    @PluginMethod
    public void disconnect(PluginCall call) {
        executor.execute(() -> {
            try {
                if (reader != null) {
                    if (connected.get()) {
                        try { reader.Actions.Inventory.stop(); } catch (Exception ignored) {}
                    }
                    try { reader.Events.removeEventsListener(rfidListener); } catch (Exception ignored) {}
                    reader.disconnect();
                }
                disposeReaders();
                connected.set(false);
                call.resolve();
            } catch (Exception e) {
                call.reject(e.getMessage() != null ? e.getMessage() : "Disconnect failed");
            }
        });
    }

    @PluginMethod
    public void startInventory(PluginCall call) {
        Integer power = call.getInt("power");
        executor.execute(() -> {
            try {
                requireConnected();
                if (power != null) setPowerLevel(power);
                reader.Actions.Inventory.perform();
                call.resolve();
            } catch (Exception e) {
                call.reject(e.getMessage() != null ? e.getMessage() : "Inventory start failed");
            }
        });
    }

    @PluginMethod
    public void stopInventory(PluginCall call) {
        executor.execute(() -> {
            try {
                requireConnected();
                reader.Actions.Inventory.stop();
                call.resolve();
            } catch (Exception e) {
                call.reject(e.getMessage() != null ? e.getMessage() : "Inventory stop failed");
            }
        });
    }

    @PluginMethod
    public void writeEpc(PluginCall call) {
        String epc = call.getString("epc");
        String targetEpc = call.getString("targetEpc");
        String accessPassword = call.getString("accessPassword", "0");
        executor.execute(() -> {
            try {
                requireConnected();
                if (epc == null || epc.isEmpty() || targetEpc == null || targetEpc.isEmpty()) {
                    call.reject("epc and targetEpc are required");
                    return;
                }
                TagAccess tagAccess = new TagAccess();
                TagAccess.WriteAccessParams params = tagAccess.new WriteAccessParams();
                params.setAccessPassword(parsePassword(accessPassword));
                params.setMemoryBank(MEMORY_BANK.MEMORY_BANK_EPC);
                params.setOffset(2);
                params.setWriteData(targetEpc);
                params.setWriteDataLength(targetEpc.length() / 4);
                params.setWriteRetries(3);
                TagData tagData = new TagData();
                reader.Actions.TagAccess.writeWait(epc, params, antennaInfo(), tagData);
                checkAccessStatus(tagData);
                JSObject result = new JSObject();
                result.put("wordsWritten", tagData.getNumberOfWords());
                call.resolve(result);
            } catch (Exception e) {
                call.reject(e.getMessage() != null ? e.getMessage() : "EPC write failed");
            }
        });
    }

    @PluginMethod
    public void writeMemory(PluginCall call) {
        String epc = call.getString("epc");
        String bank = call.getString("bank");
        String data = call.getString("data");
        Integer offset = call.getInt("offset");
        String accessPassword = call.getString("accessPassword", "0");
        executor.execute(() -> {
            try {
                requireConnected();
                if (epc == null || epc.isEmpty() || data == null || data.isEmpty()) {
                    call.reject("epc and data are required");
                    return;
                }
                MEMORY_BANK memoryBank = parseBank(bank);
                int wordOffset = offset != null ? offset : (memoryBank == MEMORY_BANK.MEMORY_BANK_EPC ? 2 : 0);
                TagAccess tagAccess = new TagAccess();
                TagAccess.WriteAccessParams params = tagAccess.new WriteAccessParams();
                params.setAccessPassword(parsePassword(accessPassword));
                params.setMemoryBank(memoryBank);
                params.setOffset(wordOffset);
                params.setWriteData(data);
                params.setWriteDataLength(data.length() / 4);
                params.setWriteRetries(3);
                TagData tagData = new TagData();
                reader.Actions.TagAccess.writeWait(epc, params, antennaInfo(), tagData);
                checkAccessStatus(tagData);
                JSObject result = new JSObject();
                result.put("wordsWritten", tagData.getNumberOfWords());
                call.resolve(result);
            } catch (Exception e) {
                call.reject(e.getMessage() != null ? e.getMessage() : "Memory write failed");
            }
        });
    }

    @PluginMethod
    public void readMemory(PluginCall call) {
        String epc = call.getString("epc");
        String bank = call.getString("bank");
        Integer offset = call.getInt("offset");
        Integer count = call.getInt("count");
        String accessPassword = call.getString("accessPassword", "0");
        executor.execute(() -> {
            try {
                requireConnected();
                if (epc == null || epc.isEmpty()) {
                    call.reject("epc is required");
                    return;
                }
                MEMORY_BANK memoryBank = parseBank(bank);
                int wordOffset = offset != null ? offset : (memoryBank == MEMORY_BANK.MEMORY_BANK_EPC ? 2 : 0);
                int wordCount = count != null ? count : 1;
                TagAccess tagAccess = new TagAccess();
                TagAccess.ReadAccessParams params = tagAccess.new ReadAccessParams();
                params.setAccessPassword(parsePassword(accessPassword));
                params.setMemoryBank(memoryBank);
                params.setOffset(wordOffset);
                params.setCount(wordCount);
                TagData tagData = reader.Actions.TagAccess.readWait(epc, params, antennaInfo());
                checkAccessStatus(tagData);
                JSObject result = new JSObject();
                result.put("data", tagData.getMemoryBankData() != null ? tagData.getMemoryBankData() : "");
                call.resolve(result);
            } catch (Exception e) {
                call.reject(e.getMessage() != null ? e.getMessage() : "Memory read failed");
            }
        });
    }

    @PluginMethod
    public void kill(PluginCall call) {
        String epc = call.getString("epc");
        String killPassword = (call.getString("killPassword") == null || call.getString("killPassword").isEmpty())
                ? "0" : call.getString("killPassword");
        executor.execute(() -> {
            try {
                requireConnected();
                if (epc == null || epc.isEmpty()) {
                    call.reject("epc is required");
                    return;
                }
                TagAccess tagAccess = new TagAccess();
                TagAccess.KillAccessParams params = tagAccess.new KillAccessParams();
                params.setKillPassword(parsePassword(killPassword));
                reader.Actions.TagAccess.killWait(epc, params, antennaInfo());
                call.resolve();
            } catch (Exception e) {
                call.reject(e.getMessage() != null ? e.getMessage() : "Kill failed");
            }
        });
    }

    @PluginMethod
    public void setPower(PluginCall call) {
        Integer power = call.getInt("power");
        executor.execute(() -> {
            try {
                requireConnected();
                if (power == null) { call.reject("power is required"); return; }
                setPowerLevel(power);
                call.resolve();
            } catch (Exception e) {
                call.reject(e.getMessage() != null ? e.getMessage() : "Set power failed");
            }
        });
    }

    @PluginMethod
    public void setBeep(PluginCall call) {
        Boolean enabled = call.getBoolean("enabled");
        executor.execute(() -> {
            try {
                requireConnected();
                if (enabled == null) { call.reject("enabled is required"); return; }
                call.resolve();
            } catch (Exception e) {
                call.reject(e.getMessage() != null ? e.getMessage() : "Set beep failed");
            }
        });
    }

    // ─── Internal helpers ──────────────────────────────────────────

    private void setPowerLevel(int powerDbm) throws Exception {
        int[] levels = reader.ReaderCapabilities.getTransmitPowerLevelValues();
        if (levels == null || levels.length == 0) return;
        powerDbm = Math.max(0, Math.min(powerDbm, MAX_TX_POWER_DBM));
        double scale = levels[levels.length - 1] / (double) MAX_TX_POWER_DBM;
        int target = (int) Math.round(powerDbm * scale);
        int bestIndex = 0;
        int bestDiff = Integer.MAX_VALUE;
        for (int i = 0; i < levels.length; i++) {
            int diff = Math.abs(levels[i] - target);
            if (diff < bestDiff) { bestDiff = diff; bestIndex = i; }
        }
        Antennas.AntennaRfConfig config = reader.Config.Antennas.getAntennaRfConfig(1);
        config.setTransmitPowerIndex(bestIndex);
        reader.Config.Antennas.setAntennaRfConfig(1, config);
    }

    private AntennaInfo antennaInfo() {
        AntennaInfo antennaInfo = new AntennaInfo();
        antennaInfo.setAntennaID(new short[]{1});
        return antennaInfo;
    }

    private void checkAccessStatus(TagData tagData) throws Exception {
        if (tagData == null || tagData.getOpStatus() != ACCESS_OPERATION_STATUS.ACCESS_SUCCESS) {
            String message = tagData != null && tagData.getOpStatus() != null
                    ? "Tag access failed: " + tagData.getOpStatus() : "Tag access failed";
            throw new IllegalStateException(message);
        }
    }

    private void requireConnected() throws Exception {
        if (reader == null || !connected.get()) throw new IllegalStateException("Reader not connected");
    }

    private long parsePassword(String password) {
        if (password == null || password.trim().isEmpty()) return 0L;
        try { return Long.parseLong(password.trim(), 16); } catch (NumberFormatException e) { return 0L; }
    }

    private MEMORY_BANK parseBank(String bank) {
        if (bank == null) return MEMORY_BANK.MEMORY_BANK_USER;
        switch (bank.toUpperCase(Locale.US)) {
            case "EPC": return MEMORY_BANK.MEMORY_BANK_EPC;
            case "TID": return MEMORY_BANK.MEMORY_BANK_TID;
            case "RESERVED": return MEMORY_BANK.MEMORY_BANK_RESERVED;
            default: return MEMORY_BANK.MEMORY_BANK_USER;
        }
    }
}
