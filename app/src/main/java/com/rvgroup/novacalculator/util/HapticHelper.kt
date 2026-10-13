package com.rvgroup.novacalculator.util

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager

class HapticHelper(private val context: Context) {

    private val vibrator: Vibrator? by lazy {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vm = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
            vm?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        }
    }

    fun vibratePattern(spec: String) {
        val vib = vibrator ?: return
        if (!vib.hasVibrator()) return
        try {
            val parts = spec.split(",").mapNotNull { it.trim().toLongOrNull() }
            if (parts.isEmpty()) return

            if (parts.size == 1) {
                val duration = parts[0].coerceIn(1L, 500L)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vib.vibrate(VibrationEffect.createOneShot(duration, VibrationEffect.DEFAULT_AMPLITUDE))
                } else {
                    @Suppress("DEPRECATION")
                    vib.vibrate(duration)
                }
            } else {
                val timings = LongArray(parts.size + 1)
                timings[0] = 0L
                for (i in parts.indices) {
                    timings[i + 1] = parts[i].coerceIn(1L, 500L)
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vib.vibrate(VibrationEffect.createWaveform(timings, -1))
                } else {
                    @Suppress("DEPRECATION")
                    vib.vibrate(timings, -1)
                }
            }
        } catch (_: Exception) {
        }
    }
}
