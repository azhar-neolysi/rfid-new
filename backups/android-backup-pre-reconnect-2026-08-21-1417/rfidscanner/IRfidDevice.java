package com.neolysi.rfid.plugins.rfidscanner;

import android.content.Context;

import com.getcapacitor.PluginCall;

/**
 * Common interface for all RFID device implementations.
 * Each device (Zebra, Urovo, etc.) implements this interface.
 */
public interface IRfidDevice {

    /** Human-readable device name (e.g. "Zebra RFD4031", "Urovo DT50") */
    String getDeviceName();

    /** Check if this device type is available/connected on the current hardware */
    boolean isAvailable(Context context);

    /** Connect to the device */
    void connect(Context context, PluginCall call) throws Exception;

    /** Disconnect from the device */
    void disconnect() throws Exception;

    /** Start continuous tag inventory scan */
    void startInventory() throws Exception;

    /** Stop continuous tag inventory scan */
    void stopInventory() throws Exception;

    /** Write a new EPC to a tag */
    void writeEpc(String epc, String targetEpc, String password) throws Exception;

    /** Write data to a memory bank */
    void writeMemory(String epc, String bank, int offset, String data, String password) throws Exception;

    /** Read data from a memory bank */
    String readMemory(String epc, String bank, int offset, int count, String password) throws Exception;

    /** Kill a tag permanently */
    void kill(String epc, String killPassword) throws Exception;

    /** Set reader transmit power (dBm) */
    void setPower(int power) throws Exception;

    /** Enable/disable reader beep */
    void setBeep(boolean enabled) throws Exception;

    /** Get diagnostic info about this device */
    String getDeviceInfo(Context context);

    /** Whether this device supports write operations */
    boolean supportsWrite();

    /** Whether this device supports kill operations */
    boolean supportsKill();
}
