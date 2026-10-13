package com.rvgroup.novacalculator.util

import android.content.Context
import android.speech.tts.TextToSpeech
import java.util.Locale

class SpeechHelper(context: Context) : TextToSpeech.OnInitListener {

    private var tts: TextToSpeech? = TextToSpeech(context.applicationContext, this)
    private var ready = false

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            ready = true
            tts?.setSpeechRate(0.95f)
            tts?.setPitch(1.0f)
        }
    }

    fun speak(text: String, langCode: String) {
        val engine = tts ?: return
        if (!ready || text.isBlank()) return
        try {
            val locale = if (langCode.lowercase(Locale.ROOT).startsWith("hi")) {
                Locale("hi", "IN")
            } else {
                Locale("en", "IN")
            }
            engine.language = locale
            engine.speak(text, TextToSpeech.QUEUE_FLUSH, null, "nova_tts_${System.currentTimeMillis()}")
        } catch (_: Exception) {
        }
    }

    fun shutdown() {
        try {
            tts?.stop()
            tts?.shutdown()
        } catch (_: Exception) {
        }
        tts = null
        ready = false
    }
}
