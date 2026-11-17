package com.aenao.dearth;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// The game's own native commands. exitApp: the main menu's Quit closes the app
// (called from the page as Capacitor.nativePromise("DearthApp", "exitApp", {})).
@CapacitorPlugin(name = "DearthApp")
public class DearthAppPlugin extends Plugin {
    @PluginMethod
    public void exitApp(PluginCall call) {
        call.resolve();
        getActivity().runOnUiThread(() -> getActivity().finishAndRemoveTask());
    }
}
