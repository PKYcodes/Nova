package com.rvgroup.novacalculator.util

import android.app.Activity
import android.media.AudioAttributes
import android.media.AudioManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.tts.TextToSpeech
import android.util.Log
import java.util.Locale

class SpeechHelper(private val activity: Activity) : TextToSpeech.OnInitListener {

    private val mainHandler = Handler(Looper.getMainLooper())
    private var tts: TextToSpeech? = null
    @Volatile private var isReady = false

    private var pendingPrimary: String? = null
    private var pendingFallback: String? = null
    private var pendingLang: String? = null

    init {
        mainHandler.post {
            try {
                tts = TextToSpeech(activity, this)
            } catch (e: Exception) {
                Log.e("SpeechHelper", "TTS init error", e)
            }
        }
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            isReady = true
            tts?.apply {
                setSpeechRate(1.0f)
                setPitch(1.0f)
                try {
                    setAudioAttributes(
                        AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_MEDIA)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                            .build()
                    )
                } catch (_: Exception) {}
            }

            val qPrimary = pendingPrimary
            val qFallback = pendingFallback
            val qLang = pendingLang
            if (qPrimary != null && qLang != null) {
                pendingPrimary = null
                pendingFallback = null
                pendingLang = null
                speakWithFallback(qPrimary, qFallback ?: qPrimary, qLang)
            }
        } else {
            Log.e("SpeechHelper", "TTS onInit failed with status $status")
        }
    }

    fun speak(text: String, langCode: String) {
        speakWithFallback(text, text, langCode)
    }

    fun speakWithFallback(primaryText: String, fallbackLatinText: String, langCode: String) {
        if (primaryText.isBlank() && fallbackLatinText.isBlank()) return

        mainHandler.post {
            val engine = tts
            if (engine == null || !isReady) {
                pendingPrimary = primaryText
                pendingFallback = fallbackLatinText
                pendingLang = langCode
                if (engine == null) {
                    try { tts = TextToSpeech(activity, this) } catch (_: Exception) {}
                }
                return@post
            }

            try {
                val isHindi = langCode.lowercase(Locale.ROOT).startsWith("hi")
                var hindiSupported = false

                if (isHindi) {
                    val hiLocales = listOf(Locale("hi", "IN"), Locale("hi"))
                    for (loc in hiLocales) {
                        val avail = engine.isLanguageAvailable(loc)
                        if (avail >= TextToSpeech.LANG_AVAILABLE) {
                            val res = engine.setLanguage(loc)
                            if (res != TextToSpeech.LANG_MISSING_DATA && res != TextToSpeech.LANG_NOT_SUPPORTED) {
                                hindiSupported = true
                                break
                            }
                        }
                    }
                }

                val textToSpeak: String
                if (isHindi && hindiSupported) {
                    textToSpeak = primaryText
                } else {
                    // Use English/Indian-English locale and Latin script fallback so TTS never goes silent!
                    val enLocales = listOf(Locale("en", "IN"), Locale.US, Locale.ENGLISH, Locale.getDefault())
                    for (loc in enLocales) {
                        val avail = engine.isLanguageAvailable(loc)
                        if (avail >= TextToSpeech.LANG_AVAILABLE) {
                            engine.setLanguage(loc)
                            break
                        }
                    }
                    textToSpeak = if (fallbackLatinText.isNotBlank()) fallbackLatinText else primaryText
                }

                val params = Bundle().apply {
                    putInt(TextToSpeech.Engine.KEY_PARAM_STREAM, AudioManager.STREAM_MUSIC)
                    putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, 1.0f)
                }
                engine.speak(textToSpeak, TextToSpeech.QUEUE_FLUSH, params, "nova_tts_${System.currentTimeMillis()}")
            } catch (e: Exception) {
                Log.e("SpeechHelper", "TTS speak error", e)
            }
        }
    }

    fun shutdown() {
        mainHandler.post {
            try {
                tts?.stop()
                tts?.shutdown()
            } catch (_: Exception) {}
            tts = null
            isReady = false
        }
    }
}
