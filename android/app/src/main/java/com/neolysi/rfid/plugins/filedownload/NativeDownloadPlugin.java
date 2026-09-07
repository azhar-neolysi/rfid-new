package com.neolysi.rfid.plugins.filedownload;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.OutputStream;

/** Saves generated files directly to the device Downloads folder. */
@CapacitorPlugin(name = "NativeDownload")
public class NativeDownloadPlugin extends Plugin {

    @PluginMethod
    public void save(PluginCall call) {
        String fileName = call.getString("fileName");
        String base64 = call.getString("base64");
        String mimeType = call.getString("mimeType", "application/octet-stream");

        if (fileName == null || fileName.trim().isEmpty() || base64 == null) {
            call.reject("fileName and base64 are required");
            return;
        }

        // Avoid allowing a caller to create nested paths outside Downloads/RFID.
        fileName = fileName.replace('\\', '/');
        fileName = fileName.substring(fileName.lastIndexOf('/') + 1);
        Uri uri = null;

        try {
            ContentValues values = new ContentValues();
            values.put(MediaStore.Downloads.DISPLAY_NAME, fileName);
            values.put(MediaStore.Downloads.MIME_TYPE, mimeType);
            values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/RFID");
            values.put(MediaStore.Downloads.IS_PENDING, 1);

            ContentResolver resolver = getContext().getContentResolver();
            uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
            if (uri == null) {
                call.reject("Unable to create the download file");
                return;
            }

            try (OutputStream stream = resolver.openOutputStream(uri)) {
                if (stream == null) throw new IllegalStateException("Unable to open the download file");
                stream.write(Base64.decode(base64, Base64.DEFAULT));
            }

            values.clear();
            values.put(MediaStore.Downloads.IS_PENDING, 0);
            resolver.update(uri, values, null, null);

            JSObject result = new JSObject();
            result.put("uri", uri.toString());
            result.put("path", "Downloads/RFID/" + fileName);
            call.resolve(result);
        } catch (Exception error) {
            if (uri != null) getContext().getContentResolver().delete(uri, null, null);
            call.reject("Could not save the download: " + error.getMessage(), error);
        }
    }
}
