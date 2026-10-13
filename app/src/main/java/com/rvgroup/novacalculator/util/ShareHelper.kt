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

    fun shareToWhatsApp(context: Context, dataUrl: String, caption: String) {
        val uri = savePngDataUrl(context, dataUrl)
        if (uri == null) {
            Toast.makeText(context, "Image banane mein dikkat hui", Toast.LENGTH_SHORT).show()
            return
        }

        val pm = context.packageManager
        val targetPkg = listOf("com.whatsapp", "com.whatsapp.w4b").firstOrNull { pkg ->
            try {
                pm.getPackageInfo(pkg, 0)
                true
            } catch (_: Exception) {
                false
            }
        }

        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "image/png"
            putExtra(Intent.EXTRA_STREAM, uri)
            putExtra(Intent.EXTRA_TEXT, caption)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
            if (targetPkg != null) {
                setPackage(targetPkg)
            }
        }

        try {
            if (targetPkg != null) {
                context.startActivity(intent)
            } else {
                val chooser = Intent.createChooser(intent, "Share via WhatsApp").apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(chooser)
            }
        } catch (_: Exception) {
            shareCalculationImage(context, dataUrl, "Nova Calculator", caption)
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
