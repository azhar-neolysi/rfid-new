package com.neolysi.rfid.plugins.rfidscanner;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.content.Context;
import android.os.Build;
import android.util.Log;

import com.zebra.rfid.api3.ENUM_TRANSPORT;
import com.zebra.rfid.api3.ReaderDevice;
import com.zebra.rfid.api3.Readers;

import java.util.ArrayList;
import java.util.Locale;
import java.util.Set;

/**
 * Detects which RFID device is connected/available.
 * Priority: External Zebra > Built-in Urovo > null
 */
public class DeviceDetector {

    private static final String TAG = "DeviceDetector";
    private static final String RFD_NAME_PATTERN = "RFD40";

    public enum DeviceType {
        ZEBRA,
        UROVO,
        NONE
    }

    /**
     * Detect the best available device type.
     * Checks for Zebra external reader first, then Urovo built-in.
     */
    public static DeviceType detect(Context context) {
        String manufacturer = Build.MANUFACTURER != null ? Build.MANUFACTURER : "null";
        String model = Build.MODEL != null ? Build.MODEL : "null";
        String device = Build.DEVICE != null ? Build.DEVICE : "null";
        Log.d(TAG, "detect() - Manufacturer: [" + manufacturer + "], Model: [" + model + "], Device: [" + device + "]");

        // 1. Check for Urovo built-in (check manufacturer/model)
        if (isUrovoDevice()) {
            Log.d(TAG, "Detected Urovo device: " + manufacturer + " " + model);
            return DeviceType.UROVO;
        }

        // 2. Check for Zebra external reader (Bluetooth bonded)
        if (isZebraAvailable(context)) {
            Log.d(TAG, "Detected Zebra reader via Bluetooth");
            return DeviceType.ZEBRA;
        }

        Log.w(TAG, "No RFID device detected. Manufacturer=[" + manufacturer + "] Model=[" + model + "] Device=[" + device + "]");
        return DeviceType.NONE;
    }

    /**
     * Check if the current device is a Urovo device with built-in RFID.
     */
    public static boolean isUrovoDevice() {
        String manufacturer = Build.MANUFACTURER != null ? Build.MANUFACTURER.toLowerCase(Locale.US) : "";
        String model = Build.MODEL != null ? Build.MODEL.toLowerCase(Locale.US) : "";
        return manufacturer.contains("urovo") || model.contains("dt50") || model.contains("dt50d");
    }

    /**
     * Check if a Zebra RFD reader is bonded via Bluetooth.
     */
    public static boolean isZebraAvailable(Context context) {
        BluetoothManager btManager = (BluetoothManager) context.getSystemService(Context.BLUETOOTH_SERVICE);
        if (btManager == null) return false;
        BluetoothAdapter adapter = btManager.getAdapter();
        if (adapter == null || !adapter.isEnabled()) return false;

        try {
            Set<BluetoothDevice> bondedDevices = adapter.getBondedDevices();
            if (bondedDevices == null) return false;

            for (BluetoothDevice device : bondedDevices) {
                String name = device.getName();
                if (name != null && name.toUpperCase(Locale.US).contains(RFD_NAME_PATTERN)) {
                    return true;
                }
            }
        } catch (SecurityException e) {
            Log.w(TAG, "SecurityException checking bonded devices: " + e.getMessage());
        }

        return false;
    }

    /**
     * Get the name of the bonded Zebra reader, if any.
     */
    public static String getZebraDeviceName(Context context) {
        BluetoothManager btManager = (BluetoothManager) context.getSystemService(Context.BLUETOOTH_SERVICE);
        if (btManager == null) return null;
        BluetoothAdapter adapter = btManager.getAdapter();
        if (adapter == null || !adapter.isEnabled()) return null;

        try {
            Set<BluetoothDevice> bondedDevices = adapter.getBondedDevices();
            if (bondedDevices == null) return null;

            for (BluetoothDevice device : bondedDevices) {
                String name = device.getName();
                if (name != null && name.toUpperCase(Locale.US).contains(RFD_NAME_PATTERN)) {
                    return name;
                }
            }
        } catch (SecurityException e) {
            Log.w(TAG, "SecurityException: " + e.getMessage());
        }

        return null;
    }

    /**
     * Create the appropriate device implementation based on type.
     */
    public static IRfidDevice createDevice(DeviceType type) {
        switch (type) {
            case ZEBRA:
                return new ZebraRfidDevice();
            case UROVO:
                return new UrovoRfidDevice();
            default:
                return null;
        }
    }
}
