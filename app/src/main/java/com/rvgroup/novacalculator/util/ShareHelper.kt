package com.rvgroup.novacalculator.util

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.util.Base64
import android.widget.Toast
import androidx.core.content.FileProvider
import java.io.File
import java.io.FileOutputStream

object ShareHelper {

    private fun savePngDataUrl(context: Context, dataUrl: String): Uri? {
        return try {
            val base64Part = dataUrl.substringAfter("base64,", "")
            if (base64Part.isEmpty()) return null
            val bytes = Base64.decode(base64Part, Base64.DEFAULT)

            val dir = File(context.cacheDir, "shared_images").apply { mkdirs() }
            val file = File(dir, "nova-calculation.png")
            FileOutputStream(file).use { it.write(bytes) }

            FileProvider.getUriForFile(
                context,
                "${context.packageName}.fileprovider",
                file
            )
        } catch (e: Exception) {
            null
        }
    }

    fun shareCalculationImage(context: Context, dataUrl: String, title: String, caption: String) {
        val uri = savePngDataUrl(context, dataUrl)
        if (uri == null) {
            Toast.makeText(context, "Image banane mein dikkat hui", Toast.LENGTH_SHORT).show()
            return
        }
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "image/png"
            putExtra(Intent.EXTRA_STREAM, uri)
            putExtra(Intent.EXTRA_TITLE, title)
            putExtra(Intent.EXTRA_TEXT, caption)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        val chooser = Intent.createChooser(intent, title).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(chooser)
    }

    fun shareToPlatform(context: Context, platform: String, dataUrl: String, caption: String) {
        val uri = if (dataUrl.isNotBlank()) savePngDataUrl(context, dataUrl) else null
        val pm = context.packageManager

        when (platform.lowercase()) {
            "whatsapp" -> {
                val targets = listOf("com.whatsapp", "com.whatsapp.w4b")
                val pkg = targets.firstOrNull { isPackageInstalled(pm, it) }
                launchOrFallback(context, pkg, uri, caption, "Share via WhatsApp")
            }
            "telegram" -> {
                val targets = listOf("org.telegram.messenger", "org.thunderdog.challegram")
                val pkg = targets.firstOrNull { isPackageInstalled(pm, it) }
                launchOrFallback(context, pkg, uri, caption, "Share via Telegram")
            }
            "twitter", "x" -> {
                val targets = listOf("com.twitter.android")
                val pkg = targets.firstOrNull { isPackageInstalled(pm, it) }
                launchOrFallback(context, pkg, uri, caption, "Share via X")
            }
            "facebook" -> {
                val targets = listOf("com.facebook.katana", "com.facebook.lite")
                val pkg = targets.firstOrNull { isPackageInstalled(pm, it) }
                launchOrFallback(context, pkg, uri, caption, "Share via Facebook")
            }
            "sms" -> {
                try {
                    val smsIntent = Intent(Intent.ACTION_VIEW).apply {
                        data = Uri.parse("sms:")
                        putExtra("sms_body", caption)
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    context.startActivity(smsIntent)
                } catch (_: Exception) {
                    shareCalculationImage(context, dataUrl, "Nova Calculator", caption)
                }
            }
            else -> {
                shareCalculationImage(context, dataUrl, "Nova Calculator", caption)
            }
        }
    }

    private fun isPackageInstalled(pm: android.content.pm.PackageManager, pkg: String): Boolean {
        return try {
            pm.getPackageInfo(pkg, 0)
            true
        } catch (_: Exception) {
            false
        }
    }

    private fun launchOrFallback(context: Context, targetPkg: String?, uri: Uri?, caption: String, chooserTitle: String) {
        val intent = Intent(Intent.ACTION_SEND).apply {
            if (uri != null) {
                type = "image/png"
                putExtra(Intent.EXTRA_STREAM, uri)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            } else {
                type = "text/plain"
            }
            putExtra(Intent.EXTRA_TEXT, caption)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            if (targetPkg != null) {
                setPackage(targetPkg)
            }
        }
        try {
            if (targetPkg != null) {
                context.startActivity(intent)
            } else {
                val chooser = Intent.createChooser(intent, chooserTitle).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(chooser)
            }
        } catch (_: Exception) {
            val chooser = Intent.createChooser(intent, chooserTitle).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(chooser)
        }
    }

    fun exportHistoryTextFile(context: Context, filename: String, content: String) {
        try {
            val safeName = filename.replace(Regex("[^a-zA-Z0-9._-]"), "_")
            val dir = File(context.cacheDir, "exports").apply { mkdirs() }
            val file = File(dir, safeName)
            file.writeText(content, Charsets.UTF_8)

            val uri = FileProvider.getUriForFile(
                context,
                "${context.packageName}.fileprovider",
                file
            )
            val intent = Intent(Intent.ACTION_SEND).apply {
                type = "text/plain"
                putExtra(Intent.EXTRA_STREAM, uri)
                putExtra(Intent.EXTRA_SUBJECT, "Nova Calculator History — RV Group LTD")
                putExtra(Intent.EXTRA_TEXT, content)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            val chooser = Intent.createChooser(intent, "Export History").apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(chooser)
        } catch (_: Exception) {
            Toast.makeText(context, "History export karne mein dikkat hui", Toast.LENGTH_SHORT).show()
        }
    }
}
