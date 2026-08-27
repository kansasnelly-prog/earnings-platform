package com.example.service

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.Path
import android.util.DisplayMetrics
import android.util.Log
import org.json.JSONObject

class RemoteControlAccessibilityService : AccessibilityService() {

    private val receiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            val payload = intent.getStringExtra("payload") ?: return
            handleEvent(payload)
        }
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        val filter = IntentFilter("com.example.REMOTE_CONTROL_EVENT")
        registerReceiver(receiver, filter)
        Log.d("RemoteControl", "Accessibility Service Connected and Listening for Events")
    }

    private fun handleEvent(payload: String) {
        try {
            val json = JSONObject(payload)
            val type = json.getString("type")
            
            val metrics = resources.displayMetrics
            
            when (type) {
                "TOUCH_DOWN", "TOUCH_MOVE", "TOUCH_UP" -> {
                    val x = (json.getDouble("x") * metrics.widthPixels).toFloat()
                    val y = (json.getDouble("y") * metrics.heightPixels).toFloat()
                    dispatchTap(x, y)
                }
                "SWIPE_UP" -> dispatchSwipe(metrics.widthPixels / 2f, metrics.heightPixels * 0.8f, metrics.widthPixels / 2f, metrics.heightPixels * 0.2f)
                "SWIPE_DOWN" -> dispatchSwipe(metrics.widthPixels / 2f, metrics.heightPixels * 0.2f, metrics.widthPixels / 2f, metrics.heightPixels * 0.8f)
            }
        } catch (e: Exception) {
            Log.e("RemoteControl", "Error handling remote event", e)
        }
    }

    private fun dispatchTap(x: Float, y: Float) {
        val path = Path()
        path.moveTo(x, y)
        val gesture = GestureDescription.Builder()
            .addStroke(GestureDescription.StrokeDescription(path, 0, 50))
            .build()
        dispatchGesture(gesture, null, null)
    }

    private fun dispatchSwipe(x1: Float, y1: Float, x2: Float, y2: Float) {
        val path = Path()
        path.moveTo(x1, y1)
        path.lineTo(x2, y2)
        val gesture = GestureDescription.Builder()
            .addStroke(GestureDescription.StrokeDescription(path, 0, 300))
            .build()
        dispatchGesture(gesture, null, null)
    }

    override fun onAccessibilityEvent(event: android.view.accessibility.AccessibilityEvent?) {}
    override fun onInterrupt() {}

    override fun onDestroy() {
        unregisterReceiver(receiver)
        super.onDestroy()
    }
}
