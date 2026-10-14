package com.rvgroup.novacalculator

import android.annotation.SuppressLint
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.view.ViewGroup
import android.webkit.JsPromptResult
import android.webkit.JsResult
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.EditText
import android.widget.FrameLayout
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowInsetsControllerCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.webkit.WebViewAssetLoader
import com.rvgroup.novacalculator.bridge.NovaNativeBridge
import com.rvgroup.novacalculator.util.HapticHelper
import com.rvgroup.novacalculator.util.SpeechHelper

/**
 * Nova Calculator — Android Native Shell (.kt / .kts)
 * Branding: RV Group LTD | ♥️ BY PANKAJ
 */
class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var hapticHelper: HapticHelper
    private lateinit var speechHelper: SpeechHelper

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Configure dark system bars matching #06070D
        window.statusBarColor = Color.parseColor("#06070D")
        window.navigationBarColor = Color.parseColor("#06070D")
        WindowInsetsControllerCompat(window, window.decorView).apply {
            isAppearanceLightStatusBars = false
            isAppearanceLightNavigationBars = false
        }

        hapticHelper = HapticHelper(this)
        speechHelper = SpeechHelper(this)

        val rootLayout = FrameLayout(this).apply {
            setBackgroundColor(Color.parseColor("#06070D"))
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        }

        webView = WebView(this).apply {
            setBackgroundColor(Color.parseColor("#06070D"))
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                isForceDarkAllowed = false
            }
            isVerticalScrollBarEnabled = false
            isHorizontalScrollBarEnabled = false
            overScrollMode = WebView.OVER_SCROLL_NEVER

            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                mediaPlaybackRequiresUserGesture = false
                allowFileAccess = false
                allowContentAccess = true
                cacheMode = WebSettings.LOAD_DEFAULT
                textZoom = 100
                setSupportZoom(false)
                builtInZoomControls = false
                displayZoomControls = false
            }

            addJavascriptInterface(
                NovaNativeBridge(this@MainActivity, hapticHelper, speechHelper),
                "AndroidBridge"
            )
        }

        // Serve bundled assets over https://appassets.androidplatform.net/assets/
        // so native ES modules (<script type="module">), localStorage, and Canvas work seamlessly.
        val assetLoader = WebViewAssetLoader.Builder()
            .setDomain("appassets.androidplatform.net")
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest
            ): WebResourceResponse? {
                return assetLoader.shouldInterceptRequest(request.url)
            }
        }

        // Native dialogs for confirm() (Clear History) and prompt() (Add Note to calculation)
        webView.webChromeClient = object : WebChromeClient() {
            override fun onJsAlert(
                view: WebView?,
                url: String?,
                message: String?,
                result: JsResult?
            ): Boolean {
                AlertDialog.Builder(this@MainActivity)
                    .setTitle("Nova Calculator")
                    .setMessage(message ?: "")
                    .setPositiveButton("OK") { _, _ -> result?.confirm() }
                    .setOnCancelListener { result?.cancel() }
                    .show()
                return true
            }

            override fun onJsConfirm(
                view: WebView?,
                url: String?,
                message: String?,
                result: JsResult?
            ): Boolean {
                AlertDialog.Builder(this@MainActivity)
                    .setTitle("Confirm")
                    .setMessage(message ?: "")
                    .setPositiveButton("Haan") { _, _ -> result?.confirm() }
                    .setNegativeButton("Cancel") { _, _ -> result?.cancel() }
                    .setOnCancelListener { result?.cancel() }
                    .show()
                return true
            }

            override fun onJsPrompt(
                view: WebView?,
                url: String?,
                message: String?,
                defaultValue: String?,
                result: JsPromptResult?
            ): Boolean {
                val input = EditText(this@MainActivity).apply {
                    setText(defaultValue ?: "")
                    setSelection(text.length)
                }
                val container = FrameLayout(this@MainActivity).apply {
                    val pad = (20 * resources.displayMetrics.density).toInt()
                    setPadding(pad, pad / 2, pad, 0)
                    addView(input)
                }
                AlertDialog.Builder(this@MainActivity)
                    .setTitle(message ?: "Note likho")
                    .setView(container)
                    .setPositiveButton("Save") { _, _ ->
                        result?.confirm(input.text?.toString() ?: "")
                    }
                    .setNegativeButton("Cancel") { _, _ ->
                        result?.cancel()
                    }
                    .setOnCancelListener { result?.cancel() }
                    .show()
                return true
            }
        }

        rootLayout.addView(
            webView,
            FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        )
                // Handle status bar, camera notch, and bottom navigation bar insets
        ViewCompat.setOnApplyWindowInsetsListener(rootLayout) { view, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            view.setPadding(bars.left, bars.top, bars.right, bars.bottom)
            insets
        }

        setContentView(rootLayout)

        // Load Nova Calculator app shell
        webView.loadUrl("https://appassets.androidplatform.net/assets/index.html")

        // Handle Android system Back gesture / button: close open drawers first
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                webView.evaluateJavascript(
                    "(function(){ return Boolean(window.__novaHandleBack && window.__novaHandleBack()); })()"
                ) { res ->
                    if (res != "true") {
                        isEnabled = false
                        onBackPressedDispatcher.onBackPressed()
                        isEnabled = true
                    }
                }
            }
        })
    }

    override fun onDestroy() {
        speechHelper.shutdown()
        webView.destroy()
        super.onDestroy()
    }
}
