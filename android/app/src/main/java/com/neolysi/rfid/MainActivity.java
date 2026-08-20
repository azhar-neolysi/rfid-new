package com.neolysi.rfid;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.neolysi.rfid.plugins.rfidscanner.RFIDScannerPlugin;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(RFIDScannerPlugin.class);
    super.onCreate(savedInstanceState);
  }
}
