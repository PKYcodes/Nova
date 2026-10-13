package com.rvgroup.novacalculator.util

import android.content.Context
import android.media.AudioAttributes
import android.os.Bundle
import android.speech.tts.TextToSpeech
import java.util.Locale

class SpeechHelper(context: Context) : TextToSpeech.OnInitListener {

    private var tts: TextToSpeech? = null
    @Volatile private var ready = false
    private var currentLangCode: String = ""

    init {
        try {
            tts = TextToSpeech(context.applicationContext, this)
        } catch (_: Exception) {}
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            ready = true
            tts?.apply {
                setSpeechRate(1.05f) // Snappy natural tempo
                setPitch(1.0f)
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ASSISTANCE_SONIFICATION)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                        .build()
                )
                // Pre-set Hindi language on initialization so voice data is warm in memory
                val hiLocale = Locale("hi", "IN")
                language = hiLocale
                currentLangCode = "hi"
                // Pre-warm audio pipeline with zero latency empty utterance
                speak("", TextToSpeech.QUEUE_FLUSH, null, "warmup")
            }
        }
    }

    fun speak(text: String, langCode: String) {
        val engine = tts ?: return
        if (!ready || text.isBlank()) return
        try {
            val targetLang = if (langCode.lowercase(Locale.ROOT).startsWith("hi")) "hi" else "en"
            if (targetLang != currentLangCode) {
                val locale = if (targetLang == "hi") Locale("hi", "IN") else Locale("en", "IN")
                engine.language = locale
                currentLangCode = targetLang
            }
            val params = Bundle().apply {
                putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, 1.0f)
            }
            engine.speak(text, TextToSpeech.QUEUE_FLUSH, params, "nova_tts_${System.currentTimeMillis()}")
        } catch (_: Exception) {}
    }

    fun shutdown() {
        try {
            tts?.stop()
            tts?.shutdown()
        } catch (_: Exception) {}
        tts = null
        ready = false
    }
}
