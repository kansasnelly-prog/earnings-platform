package com.example.bridge

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.media.projection.MediaProjectionManager
import android.webkit.JavascriptInterface
import com.example.service.ScreenMirroringService

class MirrorBridge(private val context: Context, private val activity: Activity) {

    @JavascriptInterface
    fun startMirroring() {
        val projectionManager = context.getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        activity.startActivityForResult(projectionManager.createScreenCaptureIntent(), 2001)
    }

    @JavascriptInterface
    fun stopMirroring() {
        val intent = Intent(context, ScreenMirroringService::class.java)
        context.stopService(intent)
    }

    @JavascriptInterface
    fun isMirroring(): Boolean {
        return ScreenMirroringService.isRunning
    }

    @JavascriptInterface
    fun generatePairingCode(): String {
        val part1 = (100..999).random()
        val part2 = (100..999).random()
        return "$part1 - $part2"
    }
}
