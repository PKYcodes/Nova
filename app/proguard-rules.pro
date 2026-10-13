# Keep JavascriptInterface methods for NovaNativeBridge
-keepclassmembers class com.rvgroup.novacalculator.bridge.NovaNativeBridge {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface
-keepattributes *Annotation*
