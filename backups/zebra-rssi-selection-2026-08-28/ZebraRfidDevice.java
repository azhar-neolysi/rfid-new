package com.neolysi.rfid.plugins.rfidscanner;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
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
import com.zebra.rfid.api3.SESSION;
import com.zebra.rfid.api3.START_TRIGGER_TYPE;
import com.zebra.rfid.api3.STOP_TRIGGER_TYPE;
import com.zebra.rfid.api3.HANDHELD_TRIGGER_EVENT_TYPE;
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

public class ZebraRfidDevice implements IRfidDevice, Readers.RFIDReaderEventHandler {

    private static final String TAG = "ZebraRfidDevice";
    private static final int MAX_TX_POWER_DBM = 30;
    private static final long DISCOVERY_TIMEOUT_MS = 45_000;
    private static final String RFD_NAME_PATTERN = "RFD40";

    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final AtomicBoolean connected = new AtomicBoolean(false);
    private volatile boolean inventoryRunningNative = false;
    private volatile boolean continuousMode = false;

    private static final long SINGLE_TAP_THRESHOLD_MS = 300;
    private volatile long triggerPressedTime = 0;
    private volatile boolean singleTapMode = false;

    private RfidDeviceCallback callback;
    private Context context;

    private Readers readers;
    private RFIDReader reader;
    private BroadcastReceiver discoveryReceiver;
    private BroadcastReceiver bondReceiver;
    private BluetoothAdapter bluetoothAdapter;
    private volatile boolean pairingInProgress = false;

    // Set by the plugin to route pairing calls back to connectInternal or pairReaderInternal
    private volatile boolean pendingPairForConnect = false;

    private final RfidEventsListener rfidListener = new RfidEventsListener() {
        @Override
        public void eventReadNotify(RfidReadEvents rfidReadEvents) {
            try {
                if (reader == null) return;
                TagData[] tags = reader.Actions.getReadTags(100);
                if (tags == null || tags.length == 0) return;

                // Copy the batch on the SDK thread, then emit on the main
                // thread (same pattern as the proven reference plugin).
                final ArrayList<Object[]> batch = new ArrayList<>();
                for (TagData tag : tags) {
                    if (tag == null || tag.getTagID() == null || tag.getTagID().isEmpty()) continue;
                    batch.add(new Object[]{
                            tag.getTagID(),
                            (int) tag.getPeakRSSI(),
                            (int) tag.getAntennaID(),
                            (int) tag.getChannelIndex()
                    });
                }
                if (batch.isEmpty()) return;

                // Single-tap mode (handheld, non-continuous): a quick trigger
                // press should yield exactly ONE tag, then re-arm for the next tap.
                if (singleTapMode && !continuousMode) {
                    singleTapMode = false;
                    long elapsed = System.currentTimeMillis() - triggerPressedTime;
                    if (elapsed < SINGLE_TAP_THRESHOLD_MS) {
                        final Object[] first = batch.get(0);
                        mainHandler.post(() -> {
                            if (callback == null) return;
                            callback.onTagReadWithChannel((String) first[0], (Integer) first[1], (Integer) first[2], (Integer) first[3]);
                        });
                        try { reader.Actions.Inventory.stop(); } catch (Exception ignored) {}
                        try { reader.Actions.Inventory.perform(); } catch (Exception ignored) {}
                        return;
                    }
                }

                mainHandler.post(() -> {
                    if (callback == null) return;
                    for (Object[] t : batch) {
                        callback.onTagReadWithChannel((String) t[0], (Integer) t[1], (Integer) t[2], (Integer) t[3]);
                    }
                });
            } catch (Exception e) {
                Log.e(TAG, "Error in eventReadNotify", e);
            }
        }

        @Override
        public void eventStatusNotify(RfidStatusEvents rfidStatusEvents) {
            if (rfidStatusEvents == null || rfidStatusEvents.StatusEventData == null) return;
            STATUS_EVENT_TYPE type = rfidStatusEvents.StatusEventData.getStatusEventType();
            if (type == STATUS_EVENT_TYPE.DISCONNECTION_EVENT) {
                if (reader != null && reader.isConnected()) {
                    Log.w(TAG, "Spurious disconnect event but reader still connected, ignoring");
                    return;
                }
                Log.w(TAG, "Reader disconnected event");
                connected.set(false);
                inventoryRunningNative = false;
                continuousMode = false;
                mainHandler.post(() -> {
                    if (callback != null) callback.onDisconnected();
                });
            } else if (type == STATUS_EVENT_TYPE.HANDHELD_TRIGGER_EVENT) {
                HANDHELD_TRIGGER_EVENT_TYPE triggerEvent = rfidStatusEvents.StatusEventData.HandheldTriggerEventData.getHandheldEvent();
                if (triggerEvent == HANDHELD_TRIGGER_EVENT_TYPE.HANDHELD_TRIGGER_PRESSED) {
                    triggerPressedTime = System.currentTimeMillis();
                    // Only drive single-tap in handheld (non-continuous) mode.
                    singleTapMode = !continuousMode;
                    Log.d(TAG, "Handheld trigger pressed");
                } else if (triggerEvent == HANDHELD_TRIGGER_EVENT_TYPE.HANDHELD_TRIGGER_RELEASED) {
                    singleTapMode = false;
                    Log.d(TAG, "Handheld trigger released");
                }
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
                    Log.w(TAG, "Spurious RFIDReaderDisappeared but reader still connected, ignoring");
                    return;
                }
                connected.set(false);
                if (callback != null) callback.onDisconnected();
            }
        } catch (Exception ignored) {}
    }

    // ─── IRfidDevice implementation ─────────────────────────────────

    @Override
    public String getDeviceName() {
        return "Zebra RFD4031";
    }

    @Override
    public boolean isAvailable(Context ctx) {
        return DeviceDetector.isZebraAvailable(ctx);
    }

    @Override
    public void connect(Context ctx, com.getcapacitor.PluginCall call) throws Exception {
        this.context = ctx;
        pendingPairForConnect = true;
        Log.d(TAG, "connect() - starting Zebra SDK connection flow");

        boolean bt = call.getBoolean("bt", true);
        boolean usb = call.getBoolean("usb", true);
        String btName = call.getString("btName");

        executor.execute(() -> {
            try {
                Log.d(TAG, "Creating Readers SDK (BT transport)");
                if (readers == null) {
                    readers = new Readers(ctx, ENUM_TRANSPORT.BLUETOOTH);
                }
                try {
                    Readers.attach(this);
                } catch (Exception e) {
                    Log.w(TAG, "Readers.attach (may already be attached): " + e.getMessage());
                }

                ReaderDevice candidate = null;
                if (bt) candidate = safeFindReader(ENUM_TRANSPORT.BLUETOOTH, btName, "BT");
                if (candidate == null && usb) candidate = safeFindReader(ENUM_TRANSPORT.SERVICE_USB, btName, "USB");
                if (candidate == null && usb) candidate = safeFindReader(ENUM_TRANSPORT.SERVICE_SERIAL, btName, "Serial");

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

    @Override
    public void disconnect() throws Exception {
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
                inventoryRunningNative = false;
                continuousMode = false;
            } catch (Exception e) {
                Log.e(TAG, "Disconnect error", e);
            }
        });
    }

    @Override
    public void startInventory() throws Exception {
        requireConnected();
        continuousMode = false;
        applyHandheldTriggers();
        try { reader.Actions.Inventory.stop(); } catch (Exception ignored) {}
        reader.Actions.Inventory.perform();
        inventoryRunningNative = true;
    }

    @Override
    public void startInventoryContinuous() throws Exception {
        requireConnected();
        continuousMode = true;
        try { reader.Actions.Inventory.stop(); } catch (Exception ignored) {}
        try {
            // Default session S0 maximizes first-read chance across a dense
            // population; duplicate EPCs are filtered app-side.
            Antennas.SingulationControl singulation =
                    reader.Config.Antennas.getSingulationControl(1);
            singulation.setSession(SESSION.SESSION_S0);
            reader.Config.Antennas.setSingulationControl(1, singulation);
        } catch (Exception e) { Log.w(TAG, "setSession S0: " + e.getMessage()); }
        try {
            // Never suppress repeats: live RSSI updates (locator/proximity)
            // depend on repeated reports of the same tag.
            reader.Config.setUniqueTagReport(false);
        } catch (Exception e) { Log.w(TAG, "setUniqueTagReport: " + e.getMessage()); }
        applyImmediateTriggers();
        reader.Actions.Inventory.perform();
        inventoryRunningNative = true;
    }

    @Override
    public void stopInventory() throws Exception {
        requireConnected();
        reader.Actions.Inventory.stop();
        inventoryRunningNative = false;
        continuousMode = false;
        try {
            // Restore handheld-trigger defaults so physical trigger scans keep
            // working after a software-started (continuous) session.
            applyHandheldTriggers();
            reader.Config.setUniqueTagReport(false);
        } catch (Exception e) { Log.w(TAG, "restoreDefaults after stop: " + e.getMessage()); }
    }

    @Override
    public void writeEpc(String epc, String targetEpc, String accessPassword) throws Exception {
        requireConnected();
        if (epc == null || epc.isEmpty() || targetEpc == null || targetEpc.isEmpty()) {
            throw new IllegalArgumentException("epc and targetEpc are required");
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
    }

    @Override
    public void writeMemory(String epc, String bank, int offset, String data, String password) throws Exception {
        requireConnected();
        if (epc == null || epc.isEmpty() || data == null || data.isEmpty()) {
            throw new IllegalArgumentException("epc and data are required");
        }
        MEMORY_BANK memoryBank = parseBank(bank);
        int wordOffset = (memoryBank == MEMORY_BANK.MEMORY_BANK_EPC && offset == 0) ? 2 : offset;
        TagAccess tagAccess = new TagAccess();
        TagAccess.WriteAccessParams params = tagAccess.new WriteAccessParams();
        params.setAccessPassword(parsePassword(password));
        params.setMemoryBank(memoryBank);
        params.setOffset(wordOffset);
        params.setWriteData(data);
        params.setWriteDataLength(data.length() / 4);
        params.setWriteRetries(3);
        TagData tagData = new TagData();
        reader.Actions.TagAccess.writeWait(epc, params, antennaInfo(), tagData);
        checkAccessStatus(tagData);
    }

    @Override
    public String readMemory(String epc, String bank, int offset, int count, String password) throws Exception {
        requireConnected();
        if (epc == null || epc.isEmpty()) {
            throw new IllegalArgumentException("epc is required");
        }
        MEMORY_BANK memoryBank = parseBank(bank);
        int wordOffset = (memoryBank == MEMORY_BANK.MEMORY_BANK_EPC && offset == 0) ? 2 : offset;
        int wordCount = count > 0 ? count : 1;
        TagAccess tagAccess = new TagAccess();
        TagAccess.ReadAccessParams params = tagAccess.new ReadAccessParams();
        params.setAccessPassword(parsePassword(password));
        params.setMemoryBank(memoryBank);
        params.setOffset(wordOffset);
        params.setCount(wordCount);
        TagData tagData = reader.Actions.TagAccess.readWait(epc, params, antennaInfo());
        checkAccessStatus(tagData);
        return tagData.getMemoryBankData() != null ? tagData.getMemoryBankData() : "";
    }

    @Override
    public void kill(String epc, String killPassword) throws Exception {
        requireConnected();
        if (epc == null || epc.isEmpty()) {
            throw new IllegalArgumentException("epc is required");
        }
        TagAccess tagAccess = new TagAccess();
        TagAccess.KillAccessParams params = tagAccess.new KillAccessParams();
        params.setKillPassword(parsePassword(killPassword));
        reader.Actions.TagAccess.killWait(epc, params, antennaInfo());
    }

    @Override
    public void setPower(int powerDbm) throws Exception {
        requireConnected();
        setPowerLevel(powerDbm);
    }

    @Override
    public void setBeep(boolean enabled) throws Exception {
        requireConnected();
        // Zebra beep is not configurable through the SDK in a standard way
    }

    @Override
    public String getDeviceInfo(Context ctx) {
        StringBuilder info = new StringBuilder();
        info.append("Device: ").append(getDeviceName()).append("\n");
        info.append("Connected: ").append(connected.get()).append("\n");
        info.append("SDK Initialized: ").append(readers != null).append("\n");
        info.append("Pairing In Progress: ").append(pairingInProgress).append("\n");

        BluetoothAdapter adapter = getBluetoothAdapter(ctx);
        if (adapter != null) {
            info.append("Bluetooth Enabled: ").append(adapter.isEnabled()).append("\n");
            if (adapter.isEnabled() && ContextCompat.checkSelfPermission(ctx, Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED) {
                try {
                    Set<BluetoothDevice> bonded = adapter.getBondedDevices();
                    info.append("Bonded Devices: ").append(bonded != null ? bonded.size() : 0).append("\n");
                } catch (SecurityException e) {
                    info.append("Bonded Devices: SecurityException\n");
                }
            }
        }
        return info.toString();
    }

    @Override
    public boolean supportsWrite() {
        return true;
    }

    @Override
    public boolean supportsKill() {
        return true;
    }

    // ─── Pairing helpers (called by plugin) ─────────────────────────

    public void pairReader(Context ctx, com.getcapacitor.PluginCall call) {
        this.context = ctx;
        pendingPairForConnect = false;
        Log.d(TAG, "pairReaderInternal() started");

        if (pairingInProgress) {
            call.reject("Pairing already in progress");
            return;
        }

        BluetoothAdapter adapter = getBluetoothAdapter(ctx);
        if (adapter == null || !adapter.isEnabled()) {
            call.reject("Bluetooth is not enabled. Please enable Bluetooth and try again.");
            return;
        }

        BluetoothDevice bondedDevice = findBondedRfdDevice(adapter, null);
        if (bondedDevice != null) {
            Log.d(TAG, "RFD already bonded: " + bondedDevice.getName());
            pairingInProgress = false;
            com.getcapacitor.JSObject result = new com.getcapacitor.JSObject();
            result.put("paired", true);
            result.put("name", bondedDevice.getName());
            call.resolve(result);
            return;
        }

        pairingInProgress = true;
        if (callback != null) callback.onPairingStatus("scanning", "Searching for RFD4031 reader...");
        startDiscoveryAndBond(adapter, call);
    }

    public void cleanupReceivers() {
        if (discoveryReceiver != null) {
            try { if (context != null) context.unregisterReceiver(discoveryReceiver); } catch (Exception ignored) {}
            discoveryReceiver = null;
        }
        if (bondReceiver != null) {
            try { if (context != null) context.unregisterReceiver(bondReceiver); } catch (Exception ignored) {}
            bondReceiver = null;
        }
        BluetoothAdapter adapter = context != null ? getBluetoothAdapter(context) : null;
        if (adapter != null) {
            try { adapter.cancelDiscovery(); } catch (Exception ignored) {}
        }
    }

    public void onResume() {
        reRegisterBondReceiver();
    }

    public void onPause() {
        if (bondReceiver != null) {
            try { if (context != null) context.unregisterReceiver(bondReceiver); } catch (Exception ignored) {}
        }
    }

    public boolean isConnected() {
        return connected.get();
    }

    public boolean isNativeInventoryRunning() {
        return inventoryRunningNative;
    }

    // ─── Internal connection logic ──────────────────────────────────

    private void connectToReaderDevice(com.getcapacitor.PluginCall call, ReaderDevice candidate) throws Exception {
        reader = candidate.getRFIDReader();
        if (reader == null) {
            call.reject("Reader device did not expose an RFID reader.");
            return;
        }
        if (!reader.isConnected()) {
            Log.d(TAG, "Connecting to reader: " + candidate.getName());
            try {
                reader.connect();
            } catch (Exception e) {
                Log.w(TAG, "reader.connect() failed, trying reconnect(): " + e.getMessage());
                reader.reconnect();
            }
        }
        try {
            configureReader();
        } catch (Exception e) {
            // Never fail the connection because of a config step; the hardware
            // link is already up (the reader beeps on connect).
            Log.w(TAG, "configureReader warning: " + e.getMessage());
        }
        connected.set(true);
        final String name = candidate.getName();
        Log.d(TAG, "Connected to: " + name);
        if (callback != null) callback.onConnected(name != null ? name : "RFD4031");
        com.getcapacitor.JSObject result = new com.getcapacitor.JSObject();
        result.put("connected", true);
        result.put("name", name);
        call.resolve(result);
    }

    private void attemptOsDiscoveryAndConnect(com.getcapacitor.PluginCall call, String btName) {
        BluetoothAdapter adapter = getBluetoothAdapter(context);
        if (adapter == null || !adapter.isEnabled()) {
            call.reject("Bluetooth is not enabled. Please enable Bluetooth and try again.");
            return;
        }

        if (ContextCompat.checkSelfPermission(context, Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
            call.reject("BLUETOOTH_CONNECT permission not granted.");
            return;
        }

        BluetoothDevice bondedDevice = findBondedRfdDevice(adapter, btName);
        if (bondedDevice != null) {
            Log.d(TAG, "Found bonded RFD device: " + bondedDevice.getName());
            refreshSdkAndConnect(call, bondedDevice.getName());
            return;
        }

        Log.d(TAG, "No bonded RFD found. Starting discovery...");
        pairingInProgress = true;
        if (callback != null) callback.onPairingStatus("scanning", "Searching for RFD4031 reader...");
        startDiscoveryAndBond(adapter, call);
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

    private void refreshSdkAndConnect(com.getcapacitor.PluginCall call, String deviceName) {
        Log.d(TAG, "refreshSdkAndConnect for: " + deviceName);
        executor.execute(() -> {
            try {
                disposeReaders();
                readers = new Readers(context, ENUM_TRANSPORT.BLUETOOTH);
                try {
                    Readers.attach(this);
                } catch (Exception e) {
                    Log.w(TAG, "Readers.attach (may already be attached): " + e.getMessage());
                }
                Thread.sleep(1000);

                ReaderDevice candidate = safeFindReader(ENUM_TRANSPORT.BLUETOOTH, null, "BT-refresh");
                if (candidate == null) {
                    BluetoothAdapter adapter = getBluetoothAdapter(context);
                    if (adapter != null && ContextCompat.checkSelfPermission(context, Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED) {
                        BluetoothDevice btDevice = findBondedRfdDevice(adapter, deviceName);
                        if (btDevice != null) {
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

    private void startDiscoveryAndBond(BluetoothAdapter adapter, com.getcapacitor.PluginCall call) {
        final BluetoothDevice[] foundDevice = {null};
        final boolean[] finished = {false};

        cleanupReceivers();

        discoveryReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context ctx, Intent intent) {
                if (!BluetoothDevice.ACTION_FOUND.equals(intent.getAction())) return;
                BluetoothDevice device = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
                if (device == null || device.getName() == null) return;

                String name = device.getName();
                Log.d(TAG, "BT Discovery found: " + name);

                if (name.toUpperCase(Locale.US).contains(RFD_NAME_PATTERN) && foundDevice[0] == null) {
                    foundDevice[0] = device;
                    Log.d(TAG, "Matched RFD device! Starting bond...");
                    if (callback != null) callback.onPairingStatus("found", "Found " + name + ". Pairing...");

                    try { adapter.cancelDiscovery(); } catch (Exception e) { Log.w(TAG, "cancelDiscovery error: " + e.getMessage()); }

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

        bondReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context ctx, Intent intent) {
                if (!BluetoothDevice.ACTION_BOND_STATE_CHANGED.equals(intent.getAction())) return;

                int bondState = intent.getIntExtra(BluetoothDevice.EXTRA_BOND_STATE, BluetoothDevice.BOND_NONE);
                int prevBondState = intent.getIntExtra(BluetoothDevice.EXTRA_PREVIOUS_BOND_STATE, BluetoothDevice.BOND_NONE);
                BluetoothDevice device = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
                if (device == null) return;

                String name = device.getName() != null ? device.getName() : device.getAddress();
                Log.d(TAG, "Bond state: " + prevBondState + " -> " + bondState + " for " + name);

                if (bondState == BluetoothDevice.BOND_BONDED && !finished[0]) {
                    finished[0] = true;
                    cleanupReceivers();
                    pairingInProgress = false;

                    if (callback != null) callback.onPairingComplete(name);

                    if (pendingPairForConnect) {
                        refreshSdkAndConnect(call, name);
                    } else {
                        com.getcapacitor.JSObject result = new com.getcapacitor.JSObject();
                        result.put("paired", true);
                        result.put("name", name);
                        call.resolve(result);
                    }
                } else if (bondState == BluetoothDevice.BOND_NONE && foundDevice[0] != null && !finished[0]) {
                    finished[0] = true;
                    cleanupReceivers();
                    pairingInProgress = false;
                    call.reject("Pairing was rejected. Please pair the RFD4031 in Android Bluetooth settings first.");
                }
            }
        };

        try {
            IntentFilter discoveryFilter = new IntentFilter(BluetoothDevice.ACTION_FOUND);
            IntentFilter bondFilter = new IntentFilter(BluetoothDevice.ACTION_BOND_STATE_CHANGED);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                context.registerReceiver(discoveryReceiver, discoveryFilter, Context.RECEIVER_EXPORTED);
                context.registerReceiver(bondReceiver, bondFilter, Context.RECEIVER_EXPORTED);
            } else {
                context.registerReceiver(discoveryReceiver, discoveryFilter);
                context.registerReceiver(bondReceiver, bondFilter);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to register receivers", e);
            pairingInProgress = false;
            call.reject("Failed to register Bluetooth receivers: " + e.getMessage());
            return;
        }

        boolean started = adapter.startDiscovery();
        Log.d(TAG, "startDiscovery() returned: " + started);

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

    // ─── Helpers ────────────────────────────────────────────────────

    private BluetoothDevice findBondedRfdDevice(BluetoothAdapter adapter, String btName) {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) return null;
        try {
            Set<BluetoothDevice> bondedDevices = adapter.getBondedDevices();
            if (bondedDevices == null) return null;
            for (BluetoothDevice device : bondedDevices) {
                String name = device.getName();
                if (name == null) continue;
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

    private void reRegisterBondReceiver() {
        if (pairingInProgress && bondReceiver != null && context != null) {
            try {
                IntentFilter f = new IntentFilter(BluetoothDevice.ACTION_BOND_STATE_CHANGED);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    context.registerReceiver(bondReceiver, f, Context.RECEIVER_EXPORTED);
                } else {
                    context.registerReceiver(bondReceiver, f);
                }
            } catch (Exception ignored) {}
        }
    }

    private void configureReader() throws Exception {
        if (reader == null || !reader.isConnected()) return;
        try { reader.Events.setReaderDisconnectEvent(true); } catch (Exception e) { Log.w(TAG, "setReaderDisconnectEvent: " + e.getMessage()); }
        try { reader.Events.setTagReadEvent(true); } catch (Exception e) { Log.w(TAG, "setTagReadEvent: " + e.getMessage()); }
        try { reader.Events.setAttachTagDataWithReadEvent(false); } catch (Exception e) { Log.w(TAG, "setAttachTagDataWithReadEvent: " + e.getMessage()); }
        try { reader.Events.setHandheldEvent(true); } catch (Exception e) { Log.w(TAG, "setHandheldEvent: " + e.getMessage()); }
        try {
            // Match the reference plugin: duplicates must always be reported.
            reader.Config.setUniqueTagReport(false);
        } catch (Exception e) { Log.w(TAG, "setUniqueTagReport: " + e.getMessage()); }
        try {
            reader.Events.addEventsListener(rfidListener);
        } catch (Exception e) {
            // Usually "listener already registered" after a reconnect - safe to ignore.
            Log.w(TAG, "addEventsListener (may already be attached): " + e.getMessage());
        }
        try {
            applyHandheldTriggers();
        } catch (Exception e) { Log.w(TAG, "applyHandheldTriggers: " + e.getMessage()); }
        try {
            setMaxPower();
        } catch (Exception e) { Log.w(TAG, "setMaxPower: " + e.getMessage()); }
    }

    private void applyHandheldTriggers() throws Exception {
        TriggerInfo triggerInfo = new TriggerInfo();
        triggerInfo.StartTrigger.setTriggerType(START_TRIGGER_TYPE.START_TRIGGER_TYPE_HANDHELD);
        // HANDHELD_WITH_TIMEOUT stop (proven working config): scanning stops on
        // trigger release; a short timeout guards against a stuck trigger.
        triggerInfo.StopTrigger.setTriggerType(STOP_TRIGGER_TYPE.STOP_TRIGGER_TYPE_HANDHELD_WITH_TIMEOUT);
        reader.Config.setStartTrigger(triggerInfo.StartTrigger);
        reader.Config.setStopTrigger(triggerInfo.StopTrigger);
    }

    private void applyImmediateTriggers() throws Exception {
        TriggerInfo triggerInfo = new TriggerInfo();
        triggerInfo.StartTrigger.setTriggerType(START_TRIGGER_TYPE.START_TRIGGER_TYPE_IMMEDIATE);
        // IMMEDIATE stop trigger never auto-fires; scanning is stopped via API.
        triggerInfo.StopTrigger.setTriggerType(STOP_TRIGGER_TYPE.STOP_TRIGGER_TYPE_IMMEDIATE);
        reader.Config.setStartTrigger(triggerInfo.StartTrigger);
        reader.Config.setStopTrigger(triggerInfo.StopTrigger);
    }

    /** Force TX power to the highest supported level (~30 dBm on RFD40). */
    private void setMaxPower() throws Exception {
        int[] levels = reader.ReaderCapabilities.getTransmitPowerLevelValues();
        if (levels == null || levels.length == 0) return;
        Antennas.AntennaRfConfig config = reader.Config.Antennas.getAntennaRfConfig(1);
        config.setTransmitPowerIndex(levels.length - 1);
        reader.Config.Antennas.setAntennaRfConfig(1, config);
    }

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
        if (reader == null || !connected.get()) throw new IllegalStateException("Zebra reader not connected");
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

    private void disposeReaders() {
        if (readers != null) {
            try {
                Readers.deattach(this);
                readers.Dispose();
            } catch (Exception ignored) {}
            readers = null;
        }
    }

    private BluetoothAdapter getBluetoothAdapter(Context ctx) {
        if (bluetoothAdapter != null) return bluetoothAdapter;
        BluetoothManager btManager = (BluetoothManager) ctx.getSystemService(Context.BLUETOOTH_SERVICE);
        if (btManager != null) bluetoothAdapter = btManager.getAdapter();
        return bluetoothAdapter;
    }

    public void setCallback(RfidDeviceCallback callback) {
        this.callback = callback;
    }
}
