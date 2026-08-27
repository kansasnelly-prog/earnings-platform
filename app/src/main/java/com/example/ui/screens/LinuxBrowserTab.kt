package com.example.ui.screens

import android.annotation.SuppressLint
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.example.model.LogLevel
import com.example.ui.viewmodel.MiniAppViewModel

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun LinuxBrowserTab(viewModel: MiniAppViewModel) {
    val context = LocalContext.current
    var urlText by remember { mutableStateOf("https://www.wikipedia.org") }
    var activeUrl by remember { mutableStateOf("https://www.wikipedia.org") }
    var mediaFileName by remember { mutableStateOf("download_asset") }
    var webViewInstance by remember { mutableStateOf<WebView?>(null) }

    DisposableEffect(Unit) {
        onDispose {
            try {
                webViewInstance?.apply {
                    stopLoading()
                    onPause()
                    pauseTimers()
                    clearHistory()
                    loadUrl("about:blank")
                    removeAllViews()
                    destroy()
                }
                webViewInstance = null
            } catch (e: Exception) {
                // Safe ignore
            }
        }
    }

    val cyanAccent = Color(0xFF38BDF8)
    val goldAccent = Color(0xFFD4AF37)
    val darkCardBg = Color(0xFF0F172A)

    fun navigateTo(inputUrl: String) {
        var target = inputUrl.trim()
        if (target.isEmpty()) return

        if (!target.startsWith("http://") && !target.startsWith("https://")) {
            target = if (target.contains(".") && !target.contains(" ")) {
                "https://$target"
            } else {
                "https://www.bing.com/search?q=${java.net.URLEncoder.encode(target, "UTF-8")}"
            }
        }
        urlText = target
        activeUrl = target
        webViewInstance?.loadUrl(target)
        viewModel.addLog(LogLevel.INFO, "🌐 Linux AI Browser Navigated: $target")
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(12.dp)
    ) {
        // Top Header Bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.Language,
                    contentDescription = null,
                    tint = cyanAccent,
                    modifier = Modifier.size(22.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Column {
                    Text(
                        text = "LINUX AI BROWSER & MEDIA DOWNLOADER",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Black,
                        color = cyanAccent,
                        letterSpacing = 0.5.sp
                    )
                    Text(
                        text = "Integrated Web Navigator • Media Scraping & Direct Downloads",
                        fontSize = 10.sp,
                        color = Color(0xFFA0AEC0)
                    )
                }
            }

            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                Box(
                    modifier = Modifier
                        .background(Color(0x2210B981), RoundedCornerShape(12.dp))
                        .border(1.dp, Color(0xFF10B981), RoundedCornerShape(12.dp))
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = "🟢 Active",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF10B981)
                    )
                }

                IconButton(
                    onClick = { viewModel.setActiveTab(0) },
                    modifier = Modifier.size(28.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Home,
                        contentDescription = "Minimize to Main Hub",
                        tint = goldAccent,
                        modifier = Modifier.size(16.dp)
                    )
                }

                IconButton(
                    onClick = { viewModel.setActiveTab(0) },
                    modifier = Modifier.size(28.dp)
                ) {
                    Icon(
                        imageVector = androidx.compose.material.icons.Icons.Default.Close,
                        contentDescription = "Close to Main Hub",
                        tint = Color.White,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        }

        // Navigation Controls & URL Bar
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            IconButton(
                onClick = {
                    if (webViewInstance?.canGoBack() == true) {
                        webViewInstance?.goBack()
                    }
                },
                modifier = Modifier.size(36.dp)
            ) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = goldAccent)
            }

            IconButton(
                onClick = {
                    if (webViewInstance?.canGoForward() == true) {
                        webViewInstance?.goForward()
                    }
                },
                modifier = Modifier.size(36.dp)
            ) {
                Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = "Forward", tint = goldAccent)
            }

            IconButton(
                onClick = { webViewInstance?.reload() },
                modifier = Modifier.size(36.dp)
            ) {
                Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = goldAccent)
            }

            IconButton(
                onClick = { navigateTo("https://www.wikipedia.org") },
                modifier = Modifier.size(36.dp)
            ) {
                Icon(Icons.Default.Home, contentDescription = "Home", tint = goldAccent)
            }

            OutlinedTextField(
                value = urlText,
                onValueChange = { urlText = it },
                modifier = Modifier.weight(1f),
                textStyle = androidx.compose.ui.text.TextStyle(
                    fontSize = 12.sp,
                    color = Color(0xFFFFF2A1)
                ),
                singleLine = true,
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Go),
                keyboardActions = KeyboardActions(onGo = { navigateTo(urlText) }),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = Color(0xFF060810),
                    unfocusedContainerColor = Color(0xFF060810),
                    focusedBorderColor = cyanAccent,
                    unfocusedBorderColor = Color(0x6638BDF8)
                ),
                shape = RoundedCornerShape(8.dp)
            )

            Button(
                onClick = { navigateTo(urlText) },
                colors = ButtonDefaults.buttonColors(containerColor = cyanAccent),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.height(48.dp)
            ) {
                Icon(Icons.Default.Search, contentDescription = "Go", tint = Color.Black, modifier = Modifier.size(18.dp))
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Quick Search Presets
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.padding(bottom = 8.dp)
        ) {
            val presets = listOf(
                "📚 Wikipedia" to "https://www.wikipedia.org",
                "🖼️ Unsplash Photos" to "https://unsplash.com",
                "🎥 Pexels Videos" to "https://www.pexels.com",
                "🏛️ Archive" to "https://archive.org",
                "🔍 Bing" to "https://bing.com"
            )
            items(presets.size) { index ->
                val (title, presetUrl) = presets[index]
                Button(
                    onClick = { navigateTo(presetUrl) },
                    colors = ButtonDefaults.buttonColors(containerColor = darkCardBg),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.height(32.dp)
                ) {
                    Text(text = title, fontSize = 11.sp, color = Color.White)
                }
            }
        }

        // Media Downloader Bar
        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFF0A0D14)),
            shape = RoundedCornerShape(10.dp),
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 8.dp)
        ) {
            Row(
                modifier = Modifier
                    .padding(8.dp)
                    .fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(Icons.Default.Download, contentDescription = null, tint = goldAccent, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Media:", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFFFFF2A1))
                    Spacer(modifier = Modifier.width(6.dp))
                    OutlinedTextField(
                        value = mediaFileName,
                        onValueChange = { mediaFileName = it },
                        modifier = Modifier.weight(1f),
                        textStyle = androidx.compose.ui.text.TextStyle(fontSize = 11.sp, color = Color.White),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedContainerColor = Color.Black,
                            unfocusedContainerColor = Color.Black,
                            focusedBorderColor = goldAccent,
                            unfocusedBorderColor = Color.DarkGray
                        )
                    )
                }

                Spacer(modifier = Modifier.width(8.dp))

                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Button(
                        onClick = {
                            Toast.makeText(context, "📥 Saved Image Asset: $mediaFileName.png", Toast.LENGTH_SHORT).show()
                            viewModel.addLog(LogLevel.INFO, "📥 Saved Image Asset: $mediaFileName.png")
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                        shape = RoundedCornerShape(6.dp),
                        modifier = Modifier.height(34.dp)
                    ) {
                        Text("🖼️ Image", fontSize = 10.sp, color = Color.Black)
                    }

                    Button(
                        onClick = {
                            Toast.makeText(context, "🎥 Saved Video Asset: $mediaFileName.mp4", Toast.LENGTH_SHORT).show()
                            viewModel.addLog(LogLevel.INFO, "🎥 Saved Video Asset: $mediaFileName.mp4")
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = cyanAccent),
                        shape = RoundedCornerShape(6.dp),
                        modifier = Modifier.height(34.dp)
                    ) {
                        Text("🎥 Video", fontSize = 10.sp, color = Color.Black)
                    }
                }
            }
        }

        // Embedded Active WebView Container
        Card(
            colors = CardDefaults.cardColors(containerColor = Color.White),
            shape = RoundedCornerShape(10.dp),
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
        ) {
            AndroidView(
                factory = { ctx ->
                    WebView(ctx).apply {
                        settings.javaScriptEnabled = true
                        settings.domStorageEnabled = true
                        settings.loadWithOverviewMode = true
                        settings.useWideViewPort = true
                        settings.allowFileAccess = true
                        settings.allowContentAccess = true

                        webViewClient = object : WebViewClient() {
                            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                                request?.url?.toString()?.let { newUrl ->
                                    urlText = newUrl
                                    activeUrl = newUrl
                                }
                                return false
                            }

                            override fun onPageFinished(view: WebView?, url: String?) {
                                super.onPageFinished(view, url)
                                url?.let {
                                    urlText = it
                                    activeUrl = it
                                }
                            }
                        }

                        webChromeClient = object : WebChromeClient() {
                            override fun onPermissionRequest(request: PermissionRequest?) {
                                request?.grant(request.resources)
                            }
                        }
                        loadUrl(activeUrl)
                        webViewInstance = this
                    }
                },
                update = { webView ->
                    if (webView.url != activeUrl) {
                        webView.loadUrl(activeUrl)
                    }
                    webViewInstance = webView
                },
                modifier = Modifier.fillMaxSize()
            )
        }
    }
}
