package com.neolysi.rfid.plugins.rfidscanner;

import android.content.Context;
import android.os.Build;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.PluginCall;
import com.ubx.usdk.USDKManager;
import com.ubx.usdk.rfid.RfidManager;
import com.ubx.usdk.rfid.aidl.IRfidCallback;

/**
 * Urovo DT50 RFID device implementation using native USDKLibrary.
 * Uses USDKManager/RfidManager for full RFID operations:
 * inventory, read, write, power control, etc.
 */
public class UrovoRfidDevice implements IRfidDevice {

    private static final String TAG = "UrovoRfidDevice";

    private RfidDeviceCallback callback;
    private Context context;
    private RfidManager rfidManager;
    private boolean initialized = false;
    private boolean scanning = false;

    private final IRfidCallback rfidCallback = new IRfidCallback() {
        @Override
        public void onInventoryTag(String EPC, String TID, String strRSSI) {
            if (callback != null && EPC != null && !EPC.isEmpty()) {
                int rssi = 0;
                try { rssi = Integer.parseInt(strRSSI); } catch (Exception ignored) {}
                callback.onTagRead(EPC, rssi, 1);
            }
        }

        @Override
        public void onInventoryTagEnd() {
            Log.d(TAG, "onInventoryTagEnd");
        }
    };

    // ─── IRfidDevice implementation ─────────────────────────────────

    @Override
    public String getDeviceName() {
        return "Urovo DT50";
    }

    @Override
    public boolean isAvailable(Context ctx) {
        return DeviceDetector.isUrovoDevice();
    }

    @Override
    public void connect(Context ctx, PluginCall call) throws Exception {
        this.context = ctx;
        Log.d(TAG, "connect() called - Manufacturer: " + Build.MANUFACTURER + ", Model: " + Build.MODEL);

        try {
            USDKManager instance = USDKManager.getInstance();
            if (instance == null) {
                Log.e(TAG, "USDKManager.getInstance() returned null!");
                call.reject("USDKManager.getInstance() returned null");
                return;
            }
            Log.d(TAG, "USDKManager instance obtained, calling init()...");

            instance.init(ctx, new USDKManager.InitListener() {
                @Override
                public void onStatus(USDKManager.STATUS status) {
                    Log.d(TAG, "USDKManager.init() callback - status: " + status);
                    if (status == USDKManager.STATUS.SUCCESS) {
                        Log.d(TAG, "USDKManager init SUCCESS");
                        initialized = true;
                        rfidManager = USDKManager.getInstance().getRfidManager();

                        String firmware = "";
                        try { firmware = rfidManager.getFirmwareVersion(); } catch (Exception e) { Log.w(TAG, "getFirmwareVersion failed: " + e.getMessage()); }
                        int readerType = 0;
                        try { readerType = rfidManager.getReaderType(); } catch (Exception e) { Log.w(TAG, "getReaderType failed: " + e.getMessage()); }

                        Log.d(TAG, "Firmware: " + firmware + ", ReaderType: " + readerType);

                        JSObject result = new JSObject();
                        result.put("connected", true);
                        result.put("name", "Urovo DT50");
                        result.put("firmware", firmware != null ? firmware : "");
                        result.put("readerType", readerType);
                        call.resolve(result);

                        if (callback != null) {
                            callback.onConnected("Urovo DT50");
                        }
                    } else {
                        Log.e(TAG, "USDKManager init FAILED with status: " + status);
                        call.reject("Urovo RFID SDK initialization failed: " + status);
                    }
                }
            });
        } catch (NoClassDefFoundError e) {
            Log.e(TAG, "NoClassDefFoundError during Urovo connect - missing nested JARs?", e);
            call.reject("Urovo RFID SDK missing dependency: " + e.getMessage());
        } catch (Exception e) {
            Log.e(TAG, "Exception during Urovo connect", e);
            call.reject("Urovo connect failed: " + e.getMessage());
        }
    }

    @Override
    public void disconnect() throws Exception {
        stopScanning();
        if (rfidManager != null) {
            try { rfidManager.disConnect(); } catch (Exception e) { Log.w(TAG, "disConnect error: " + e.getMessage()); }
            try { rfidManager.release(); } catch (Exception e) { Log.w(TAG, "release error: " + e.getMessage()); }
            rfidManager = null;
        }
        initialized = false;
        USDKManager.getInstance().release();
        Log.d(TAG, "Disconnected");
    }

    @Override
    public void startInventory() throws Exception {
        requireConnected();
        rfidManager.registerCallback(rfidCallback);
        rfidManager.startRead();
        scanning = true;
        Log.d(TAG, "Inventory started");
    }

    @Override
    public void startInventoryContinuous() throws Exception {
        // Urovo reads continuously regardless of trigger; same as normal start.
        startInventory();
    }

    @Override
    public void stopInventory() throws Exception {
        requireConnected();
        rfidManager.stopInventory();
        scanning = false;
        Log.d(TAG, "Inventory stopped");
    }

    @Override
    public void writeEpc(String epc, String targetEpc, String password) throws Exception {
        requireConnected();
        if (epc == null || epc.isEmpty() || targetEpc == null || targetEpc.isEmpty()) {
            throw new IllegalArgumentException("epc and targetEpc are required");
        }
        String pwd = password != null && !password.isEmpty() ? password : "00000000";
        Log.d(TAG, "writeEpc: " + epc + " -> " + targetEpc);
        int ret = rfidManager.writeEpcString(targetEpc, pwd);
        if (ret != 0) {
            throw new IllegalStateException("writeEpc failed with code: " + ret);
        }
    }

    @Override
    public void writeMemory(String epc, String bank, int offset, String data, String password) throws Exception {
        requireConnected();
        if (epc == null || epc.isEmpty() || data == null || data.isEmpty()) {
            throw new IllegalArgumentException("epc and data are required");
        }
        byte memBank = parseBank(bank);
        String pwd = password != null && !password.isEmpty() ? password : "00000000";
        byte[] pwdBytes = hexStringToBytes(pwd);
        byte[] dataBytes = hexStringToBytes(data);
        int wordCount = dataBytes.length / 2;
        if (dataBytes.length % 2 != 0) wordCount++;

        Log.d(TAG, "writeTag: epc=" + epc + " bank=" + memBank + " offset=" + offset + " words=" + wordCount);
        int ret = rfidManager.writeTag(epc, pwdBytes, memBank, (byte) offset, (byte) wordCount, dataBytes);
        if (ret != 0) {
            throw new IllegalStateException("writeMemory failed with code: " + ret);
        }
    }

    @Override
    public String readMemory(String epc, String bank, int offset, int count, String password) throws Exception {
        requireConnected();
        if (epc == null || epc.isEmpty()) {
            throw new IllegalArgumentException("epc is required");
        }
        byte memBank = parseBank(bank);
        String pwd = password != null && !password.isEmpty() ? password : "00000000";
        byte[] pwdBytes = hexStringToBytes(pwd);

        Log.d(TAG, "readTag: epc=" + epc + " bank=" + memBank + " offset=" + offset + " count=" + count);
        String data = rfidManager.readTag(epc, memBank, (byte) offset, (byte) count, pwdBytes);
        if (data == null || data.isEmpty()) {
            throw new IllegalStateException("readMemory failed - no data returned");
        }
        return data;
    }

    @Override
    public void kill(String epc, String killPassword) throws Exception {
        throw new UnsupportedOperationException("Urovo DT50 SDK does not support kill operations. Use Zebra RFD4031 for killing.");
    }

    @Override
    public void setPower(int power) throws Exception {
        requireConnected();
        if (power < 0 || power > 33) {
            throw new IllegalArgumentException("Power must be 0-33 dBm");
        }
        int ret = rfidManager.setOutputPower((byte) power);
        if (ret != 0) {
            throw new IllegalStateException("setPower failed with code: " + ret);
        }
        Log.d(TAG, "Power set to " + power + " dBm");
    }

    @Override
    public void setBeep(boolean enabled) throws Exception {
        requireConnected();
        // Beep control not directly exposed in the SDK API
        Log.w(TAG, "setBeep: not available via SDK API");
    }

    @Override
    public String getDeviceInfo(Context ctx) {
        StringBuilder info = new StringBuilder();
        info.append("Device: ").append(getDeviceName()).append("\n");
        info.append("Manufacturer: ").append(Build.MANUFACTURER).append("\n");
        info.append("Model: ").append(Build.MODEL).append("\n");
        info.append("SDK Initialized: ").append(initialized).append("\n");
        info.append("Scanning: ").append(scanning).append("\n");

        if (rfidManager != null) {
            try { info.append("Firmware: ").append(rfidManager.getFirmwareVersion()).append("\n"); } catch (Exception ignored) {}
            try { info.append("ReaderType: ").append(rfidManager.getReaderType()).append("\n"); } catch (Exception ignored) {}
            try { info.append("Power: ").append(rfidManager.getOutputPower()).append(" dBm\n"); } catch (Exception ignored) {}
            try { info.append("DeviceID: ").append(rfidManager.getDeviceId()).append("\n"); } catch (Exception ignored) {}
        }
        return info.toString();
    }

    @Override
    public boolean supportsWrite() {
        return true;
    }

    @Override
    public boolean supportsKill() {
        return false;
    }

    // ─── Helpers ────────────────────────────────────────────────────

    private void requireConnected() throws Exception {
        if (!initialized || rfidManager == null) {
            throw new IllegalStateException("Urovo RFID not connected. Call connect() first.");
        }
    }

    private void stopScanning() {
        if (scanning && rfidManager != null) {
            try { rfidManager.stopInventory(); } catch (Exception ignored) {}
            scanning = false;
        }
    }

    /**
     * Map string bank name to Urovo SDK byte:
     * 0x00=RESERVED, 0x01=EPC, 0x02=TID, 0x03=USER
     */
    private byte parseBank(String bank) {
        if (bank == null) return 0x01; // default to EPC
        switch (bank.toUpperCase(java.util.Locale.US)) {
            case "RESERVED": return 0x00;
            case "EPC":      return 0x01;
            case "TID":      return 0x02;
            case "USER":     return 0x03;
            default:         return 0x01;
        }
    }

    private byte[] hexStringToBytes(String hexString) {
        hexString = hexString.replaceAll(" ", "").toLowerCase();
        final byte[] byteArray = new byte[hexString.length() >> 1];
        int index = 0;
        for (int i = 0; i < hexString.length(); i++) {
            if (index > hexString.length() - 1) return byteArray;
            byte highDit = (byte) (Character.digit(hexString.charAt(index), 16) & 0xFF);
            byte lowDit = (byte) (Character.digit(hexString.charAt(index + 1), 16) & 0xFF);
            byteArray[i] = (byte) (highDit << 4 | lowDit);
            index += 2;
        }
        return byteArray;
    }

    public void setCallback(RfidDeviceCallback callback) {
        this.callback = callback;
    }

    public boolean isScanning() {
        return scanning;
    }
}
