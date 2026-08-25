package com.neolysi.rfid.plugins.rfidscanner;

/**
 * Callback interface for RFID device implementations to notify the plugin
 * about events (tag reads, connection status, pairing status).
 */
public interface RfidDeviceCallback {
    void onTagRead(String epc, int rssi, int antennaId);
    void onTagDetails(String epc, String tid, String userMemory);
    void onConnected(String deviceName);
    void onDisconnected();
    void onPairingStatus(String status, String message);
    void onPairingComplete(String name);
}
