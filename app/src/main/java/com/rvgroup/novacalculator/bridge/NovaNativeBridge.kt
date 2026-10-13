package com.rvgroup.novacalculator.bridge

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.webkit.JavascriptInterface
import com.rvgroup.novacalculator.util.HapticHelper
import com.rvgroup.novacalculator.util.ShareHelper
import com.rvgroup.novacalculator.util.SpeechHelper

/**
 * Native Android <-> WebView Bridge for Nova Calculator
 * Branding: RV Group LTD | ♥️ BY PANKAJ
 */
class NovaNativeBridge(
    private val context: Context,
    private val hapticHelper: HapticHelper,
    private val speechHelper: SpeechHelper
) {
    private val mainHandler = Handler(Looper.getMainLooper())

    @JavascriptInterface
    fun vibrate(spec: String) {
        hapticHelper.vibratePattern(spec)
    }

    @JavascriptInterface
    fun speak(text: String, lang: String) {
        speechHelper.speak(text, lang)
    }

    @JavascriptInterface
    fun copyToClipboard(text: String) {
        mainHandler.post {
            try {
                val cm = context.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
                cm?.setPrimaryClip(ClipData.newPlainText("Nova Calculator", text))
            } catch (_: Exception) {
            }
        }
    }

    @JavascriptInterface
    fun readClipboard(): String {
        return try {
            val cm = context.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
            val item = cm?.primaryClip?.getItemAt(0)
            item?.coerceToText(context)?.toString() ?: ""
        } catch (_: Exception) {
            ""
        }
    }

    @JavascriptInterface
    fun shareImage(dataUrl: String, title: String, caption: String) {
        mainHandler.post {
            ShareHelper.shareCalculationImage(context, dataUrl, title, caption)
        }
    }

    @JavascriptInterface
    fun shareWhatsApp(dataUrl: String, caption: String) {
        mainHandler.post {
            ShareHelper.shareToWhatsApp(context, dataUrl, caption)
        }
    }

    @JavascriptInterface
    fun exportHistoryText(filename: String, content: String) {
        mainHandler.post {
            ShareHelper.exportHistoryTextFile(context, filename, content)
        }
    }

    @JavascriptInterface
    fun getBrandSignature(): String = "RV Group LTD | ♥️ BY PANKAJ"
}
