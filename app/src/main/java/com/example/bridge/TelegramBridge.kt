package com.example.bridge

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.webkit.JavascriptInterface
import android.widget.Toast
import com.example.model.LogLevel
import org.json.JSONObject

class TelegramBridge(
    private val context: Context,
    private val onLog: (LogLevel, String) -> Unit,
    private val onMainButtonStateChanged: (JSONObject) -> Unit,
    private val onBackButtonStateChanged: (Boolean) -> Unit,
    private val onSendDataReceived: (String) -> Unit,
    private val onCloseRequested: () -> Unit,
    private val onShowAlertRequested: (String) -> Unit
) {

    @JavascriptInterface
    fun logConsole(levelStr: String, message: String) {
        val level = when (levelStr.uppercase()) {
            "WARN", "WARNING" -> LogLevel.WARNING
            "ERROR" -> LogLevel.ERROR
            "DEBUG" -> LogLevel.DEBUG
            "BRIDGE" -> LogLevel.BRIDGE
            else -> LogLevel.INFO
        }
        onLog(level, message)
    }

    @JavascriptInterface
    fun updateMainButton(jsonParamsStr: String) {
        try {
            val json = JSONObject(jsonParamsStr)
            onLog(LogLevel.BRIDGE, "Telegram.WebApp.MainButton updated: $jsonParamsStr")
            onMainButtonStateChanged(json)
        } catch (e: Exception) {
            onLog(LogLevel.ERROR, "Error parsing MainButton params: ${e.message}")
        }
    }

    @JavascriptInterface
    fun updateBackButton(visible: Boolean) {
        onLog(LogLevel.BRIDGE, "Telegram.WebApp.BackButton setVisible($visible)")
        onBackButtonStateChanged(visible)
    }

    @JavascriptInterface
    fun sendData(data: String) {
        onLog(LogLevel.BRIDGE, "Telegram.WebApp.sendData() received: $data")
        onSendDataReceived(data)
    }

    @JavascriptInterface
    fun close() {
        onLog(LogLevel.BRIDGE, "Telegram.WebApp.close() requested")
        onCloseRequested()
    }

    @JavascriptInterface
    fun showAlert(message: String) {
        onLog(LogLevel.BRIDGE, "Telegram.WebApp.showAlert(): $message")
        onShowAlertRequested(message)
    }

    @JavascriptInterface
    fun triggerHaptic(type: String, style: String) {
        onLog(LogLevel.BRIDGE, "HapticFeedback: $type ($style)")
        try {
            val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
                vibratorManager.defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
            }

            if (vibrator.hasVibrator()) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    val effect = when (style.lowercase()) {
                        "heavy" -> VibrationEffect.createOneShot(100, VibrationEffect.DEFAULT_AMPLITUDE)
                        "medium" -> VibrationEffect.createOneShot(60, VibrationEffect.DEFAULT_AMPLITUDE)
                        "light" -> VibrationEffect.createOneShot(30, VibrationEffect.DEFAULT_AMPLITUDE)
                        "rigid" -> VibrationEffect.createOneShot(40, 200)
                        "soft" -> VibrationEffect.createOneShot(20, 100)
                        else -> VibrationEffect.createOneShot(50, VibrationEffect.DEFAULT_AMPLITUDE)
                    }
                    vibrator.vibrate(effect)
                } else {
                    @Suppress("DEPRECATION")
                    vibrator.vibrate(50)
                }
            }
        } catch (e: Exception) {
            // ignore haptic errors if missing hardware
        }
    }

    @JavascriptInterface
    fun showToast(message: String) {
        try {
            android.os.Handler(android.os.Looper.getMainLooper()).post {
                try {
                    Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
                } catch (e: Exception) {
                    // Safe catch
                }
            }
        } catch (e: Exception) {
            // Safe catch
        }
    }

    @JavascriptInterface
    fun getGeminiApiKey(): String {
        return try {
            com.example.BuildConfig.GEMINI_API_KEY
        } catch (e: Exception) {
            ""
        }
    }

    @JavascriptInterface
    fun openExternalBrowser(url: String) {
        try {
            onLog(LogLevel.BRIDGE, "Opening external browser / intent for: $url")
            val intent = android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(url))
            intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
        } catch (e: Exception) {
            onLog(LogLevel.ERROR, "Error opening external browser: ${e.message}")
        }
    }
}
