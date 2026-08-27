package com.example.ui.components

import android.annotation.SuppressLint
import android.graphics.Bitmap
import android.webkit.ConsoleMessage
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import com.example.MainActivity
import com.example.bridge.MirrorBridge
import com.example.bridge.TelegramBridge
import com.example.bridge.TelegramWebAppJS
import com.example.model.LogLevel
import com.example.model.TelegramThemeParams
import com.example.model.TelegramUser
import org.json.JSONObject

@SuppressLint("SetJavaScriptEnabled")
@Suppress("DEPRECATION")
@Composable
fun WebViewContainer(
    htmlContent: String,
    user: TelegramUser,
    themeParams: TelegramThemeParams,
    modifier: Modifier = Modifier,
    onLog: (LogLevel, String) -> Unit = { _, _ -> },
    onMainButtonStateChanged: (JSONObject) -> Unit = {},
    onBackButtonStateChanged: (Boolean) -> Unit = {},
    onSendDataReceived: (String) -> Unit = {},
    onCloseRequested: () -> Unit = {},
    onShowAlertRequested: (String) -> Unit = {},
    onWebViewCreated: (WebView) -> Unit = {}
) {
    val context = LocalContext.current

    val bridge = remember(user, themeParams) {
        TelegramBridge(
            context = context,
            onLog = onLog,
            onMainButtonStateChanged = onMainButtonStateChanged,
            onBackButtonStateChanged = onBackButtonStateChanged,
            onSendDataReceived = onSendDataReceived,
            onCloseRequested = onCloseRequested,
            onShowAlertRequested = onShowAlertRequested
        )
    }

    val mirrorBridge = remember {
        MirrorBridge(context = context, activity = context as MainActivity)
    }

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
                // Ignore cleanup errors
            }
        }
    }

    AndroidView(
        modifier = modifier,
        factory = { ctx ->
            WebView(ctx).apply {
                webViewInstance = this
                setBackgroundColor(android.graphics.Color.parseColor("#0A0A11"))
                isVerticalScrollBarEnabled = true
                isHorizontalScrollBarEnabled = false
                isNestedScrollingEnabled = true
                overScrollMode = WebView.OVER_SCROLL_ALWAYS
                settings.apply {
                    javaScriptEnabled = true
                    domStorageEnabled = true
                    databaseEnabled = true
                    allowFileAccess = true
                    allowContentAccess = true
                    useWideViewPort = true
                    loadWithOverviewMode = true
                    mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                    mediaPlaybackRequiresUserGesture = false
                    cacheMode = WebSettings.LOAD_DEFAULT
                    setSupportZoom(false)
                    javaScriptCanOpenWindowsAutomatically = true
                    userAgentString = "Mozilla/5.0 (Linux; Android 13; Mobile; rv:120.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
                }

                val cookieManager = android.webkit.CookieManager.getInstance()
                cookieManager.setAcceptCookie(true)
                cookieManager.setAcceptThirdPartyCookies(this, true)

                isFocusable = true
                isFocusableInTouchMode = true
                isClickable = true
                
                // Use software layer type to avoid missing rendernode crash in headless container
                try {
                    setLayerType(android.view.View.LAYER_TYPE_SOFTWARE, null)
                } catch (_: Throwable) {}

                addJavascriptInterface(bridge, "AndroidBridge")
                addJavascriptInterface(mirrorBridge, "MirrorBridge")

                webChromeClient = object : WebChromeClient() {
                    override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                        consoleMessage?.let {
                            val level = when (it.messageLevel()) {
                                ConsoleMessage.MessageLevel.WARNING -> LogLevel.WARNING
                                ConsoleMessage.MessageLevel.ERROR -> LogLevel.ERROR
                                ConsoleMessage.MessageLevel.DEBUG -> LogLevel.DEBUG
                                else -> LogLevel.INFO
                            }
                            onLog(level, "${it.message()} (line ${it.lineNumber()})")
                        }
                        return true
                    }

                    override fun onJsAlert(
                        view: WebView?,
                        url: String?,
                        message: String?,
                        result: android.webkit.JsResult?
                    ): Boolean {
                        onShowAlertRequested(message ?: "")
                        result?.confirm()
                        return true
                    }

                    override fun onJsConfirm(
                        view: WebView?,
                        url: String?,
                        message: String?,
                        result: android.webkit.JsResult?
                    ): Boolean {
                        onShowAlertRequested(message ?: "")
                        result?.confirm()
                        return true
                    }

                    override fun onJsPrompt(
                        view: WebView?,
                        url: String?,
                        message: String?,
                        defaultValue: String?,
                        result: android.webkit.JsPromptResult?
                    ): Boolean {
                        result?.confirm(defaultValue ?: "")
                        return true
                    }

                    override fun onPermissionRequest(request: PermissionRequest?) {
                        try {
                            request?.grant(request.resources)
                        } catch (e: Exception) {
                            // Safe catch if permissions pending
                        }
                    }
                }

                webViewClient = object : WebViewClient() {
                    override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                        super.onPageStarted(view, url, favicon)
                        val js = TelegramWebAppJS.generateInjectionScript(user, themeParams)
                        view?.evaluateJavascript(js, null)
                    }

                    override fun onPageFinished(view: WebView?, url: String?) {
                        super.onPageFinished(view, url)
                        val js = TelegramWebAppJS.generateInjectionScript(user, themeParams)
                        view?.evaluateJavascript(js, null)
                    }

                    override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                        val url = request?.url?.toString() ?: return false
                        if (url.startsWith("intent://") || url.startsWith("instagram://") || url.startsWith("tg://") || url.startsWith("market://")) {
                            try {
                                val intent = android.content.Intent.parseUri(url, android.content.Intent.URI_INTENT_SCHEME)
                                intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
                                context.startActivity(intent)
                                return true
                            } catch (e: Exception) {
                                onLog(LogLevel.ERROR, "Intent launch error: ${e.message}")
                            }
                        }
                        return false
                    }
                }

                tag = htmlContent
                onWebViewCreated(this)
                loadDataWithBaseURL("https://web.telegram.org/?v=${htmlContent.hashCode()}", htmlContent, "text/html", "UTF-8", null)
            }
        },
        update = { webView ->
            webViewInstance = webView
            if (webView.tag != htmlContent) {
                webView.tag = htmlContent
                val js = TelegramWebAppJS.generateInjectionScript(user, themeParams)
                webView.evaluateJavascript(js, null)
                webView.loadDataWithBaseURL("https://web.telegram.org/?v=${htmlContent.hashCode()}", htmlContent, "text/html", "UTF-8", null)
            }
        }
    )
}
