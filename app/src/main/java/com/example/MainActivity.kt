package com.example

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import com.example.service.ScreenMirroringService
import com.example.ui.screens.MiniAppHomeScreen
import com.example.ui.theme.MyApplicationTheme
import com.example.ui.viewmodel.MiniAppViewModel
import java.io.File

class MainActivity : ComponentActivity() {

    private val miniAppViewModel: MiniAppViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Clean up stale / corrupted WebView code cache directories on startup
        try {
            val webViewCacheDir = File(cacheDir, "WebView/Default/HTTP Cache/Code Cache/js")
            if (webViewCacheDir.exists() && webViewCacheDir.isDirectory) {
                val files = webViewCacheDir.listFiles()
                files?.forEach { file ->
                    if (!file.canRead() || file.length() == 0L) {
                        file.delete()
                    }
                }
            } else if (!webViewCacheDir.exists()) {
                webViewCacheDir.mkdirs()
            }
        } catch (_: Exception) {
            // Safe fallback
        }

        enableEdgeToEdge()
        setContent {
            MyApplicationTheme {
                MiniAppHomeScreen(viewModel = miniAppViewModel)
            }
        }
    }

    override fun onResume() {
        super.onResume()
        miniAppViewModel.onResumeWebView()
    }

    override fun onPause() {
        miniAppViewModel.onPauseWebView()
        super.onPause()
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == 2001 && resultCode == Activity.RESULT_OK && data != null) {
            ScreenMirroringService.resultCode = resultCode
            ScreenMirroringService.resultData = data
            val intent = Intent(this, ScreenMirroringService::class.java)
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                startForegroundService(intent)
            } else {
                startService(intent)
            }
        }
    }
}

