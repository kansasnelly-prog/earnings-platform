package com.example.ui.viewmodel

import android.app.Application
import android.content.Context
import android.webkit.WebView
import android.widget.Toast
import androidx.lifecycle.AndroidViewModel
import com.example.data.SampleMiniApps
import com.example.model.ConsoleLogItem
import com.example.model.LogLevel
import com.example.model.MainButtonState
import com.example.model.TelegramThemeParams
import com.example.model.TelegramUser
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

import androidx.lifecycle.viewModelScope
import com.example.BuildConfig
import com.example.data.GeminiService
import com.example.model.GeminiChatMessage
import kotlinx.coroutines.launch

class MiniAppViewModel(application: Application) : AndroidViewModel(application) {

    private val dateFormat = SimpleDateFormat("HH:mm:ss.SSS", Locale.getDefault())
    private val prefs = application.getSharedPreferences("gemini_prefs", Context.MODE_PRIVATE)

    private val initialApiKey: String
        get() {
            val savedKey = prefs.getString("gemini_api_key", "") ?: ""
            if (savedKey.isNotBlank()) return savedKey
            if (BuildConfig.GEMINI_API_KEY.isNotBlank() && BuildConfig.GEMINI_API_KEY != "MY_GEMINI_API_KEY") {
                return BuildConfig.GEMINI_API_KEY
            }
            return "AIzaSyB8ReoZFLRfksOYdC1itXTOrhPAl9ZhWf0"
        }

    private val _htmlCode = MutableStateFlow(SampleMiniApps.getDefaultHtml(application))
    val htmlCode: StateFlow<String> = _htmlCode.asStateFlow()

    private val _selectedTemplateId = MutableStateFlow("google_ai_studio")
    val selectedTemplateId: StateFlow<String> = _selectedTemplateId.asStateFlow()

    private val _user = MutableStateFlow(TelegramUser())
    val user: StateFlow<TelegramUser> = _user.asStateFlow()

    private val _themeParams = MutableStateFlow(TelegramThemeParams())
    val themeParams: StateFlow<TelegramThemeParams> = _themeParams.asStateFlow()

    private val _mainButtonState = MutableStateFlow(MainButtonState())
    val mainButtonState: StateFlow<MainButtonState> = _mainButtonState.asStateFlow()

    private val _hasBackButton = MutableStateFlow(false)
    val hasBackButton: StateFlow<Boolean> = _hasBackButton.asStateFlow()

    private val _consoleLogs = MutableStateFlow<List<ConsoleLogItem>>(emptyList())
    val consoleLogs: StateFlow<List<ConsoleLogItem>> = _consoleLogs.asStateFlow()

    private val _activeTab = MutableStateFlow(0) // 0: SREYMARA Main Hub, 1: HTML Editor, 2: Config/User, 3: Logs, 4: Gemini AI, 5: Linux AI Browser
    val activeTab: StateFlow<Int> = _activeTab.asStateFlow()

    private val _alertMessage = MutableStateFlow<String?>(null)
    val alertMessage: StateFlow<String?> = _alertMessage.asStateFlow()

    private val _receivedData = MutableStateFlow<String?>(null)
    val receivedData: StateFlow<String?> = _receivedData.asStateFlow()

    private val _geminiApiKey = MutableStateFlow(initialApiKey)
    val geminiApiKey: StateFlow<String> = _geminiApiKey.asStateFlow()

    private val _geminiMessages = MutableStateFlow<List<GeminiChatMessage>>(
        listOf(
            GeminiChatMessage(
                sender = "Gemini VIP Director",
                text = "Welcome, Executive! I am your Gemini VIP AI Director & Manager for this Telegram Mini-App.\n\nI can coordinate your 20 Earning Strategies, monitor Solana 2-Hour Vault drops, optimize earnings.ink cinema streaming yields, audit HTML/JS bugs, and help you customize or expand this mini-app at any level. How may I assist your ecosystem today?",
                timestamp = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date())
            )
        )
    )
    val geminiMessages: StateFlow<List<GeminiChatMessage>> = _geminiMessages.asStateFlow()

    private val _isGeminiThinking = MutableStateFlow(false)
    val isGeminiThinking: StateFlow<Boolean> = _isGeminiThinking.asStateFlow()

    var activeWebView: WebView? = null

    fun updateGeminiApiKey(key: String) {
        val trimmedKey = key.trim()
        if (trimmedKey.isBlank()) {
            addLog(LogLevel.WARNING, "Ignored empty Gemini API Key update to prevent key lock clearing")
            return
        }
        _geminiApiKey.value = trimmedKey
        prefs.edit().putString("gemini_api_key", trimmedKey).apply()
        addLog(LogLevel.INFO, "Updated & Locked Gemini API Key in persistent local storage")
    }

    fun sendGeminiPrompt(userPrompt: String) {
        if (userPrompt.isBlank() || _isGeminiThinking.value) return

        val userTime = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date())
        val userMsg = GeminiChatMessage(sender = "You", text = userPrompt, timestamp = userTime)
        _geminiMessages.update { it + userMsg }

        _isGeminiThinking.value = true
        addLog(LogLevel.INFO, "Sending prompt to Gemini AI Manager...")

        val logsSummary = _consoleLogs.value.takeLast(10).joinToString("\n") { "[${it.level}] ${it.message}" }

        viewModelScope.launch {
            val result = GeminiService.chatWithGemini(
                userPrompt = userPrompt,
                customApiKey = _geminiApiKey.value,
                currentHtmlContext = _htmlCode.value,
                consoleLogsContext = logsSummary
            )

            val replyTime = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date())
            result.onSuccess { reply ->
                _geminiMessages.update {
                    it + GeminiChatMessage(
                        sender = "Gemini VIP Director",
                        text = reply,
                        timestamp = replyTime
                    )
                }
                addLog(LogLevel.INFO, "Received Gemini AI response")
            }.onFailure { err ->
                val errMsg = err.message ?: "Unknown error"
                _geminiMessages.update {
                    it + GeminiChatMessage(
                        sender = "Gemini System Error",
                        text = "⚠️ Gemini API Error:\n$errMsg\n\nTip: Check your API Key configuration in the Gemini Key settings banner above or enter a valid Gemini API key.",
                        timestamp = replyTime,
                        isError = true
                    )
                }
                addLog(LogLevel.ERROR, "Gemini AI Error: $errMsg")
            }

            _isGeminiThinking.value = false
        }
    }

    fun setActiveTab(tab: Int) {
        try {
            _activeTab.value = tab
            addLog(LogLevel.INFO, "Navigated to tab index $tab")
        } catch (e: Exception) {
            android.util.Log.e("TabNavigation", "Tab Navigation Error: ${e.message}", e)
        }
    }

    fun updateHtmlCode(newCode: String) {
        _htmlCode.value = newCode
        _selectedTemplateId.value = "custom_uploaded"
        addLog(LogLevel.INFO, "HTML Code updated (${newCode.length} chars)")
    }

    fun selectTemplate(templateId: String) {
        val tmpl = SampleMiniApps.templates.find { it.id == templateId }
        if (tmpl != null) {
            _selectedTemplateId.value = templateId
            _htmlCode.value = tmpl.htmlCode
            addLog(LogLevel.INFO, "Loaded template: ${tmpl.title}")
            _mainButtonState.value = MainButtonState()
            _hasBackButton.value = false
        }
    }

    fun updateUser(newUser: TelegramUser) {
        _user.value = newUser
        addLog(LogLevel.INFO, "Updated mock user @${newUser.username}")
    }

    fun updateThemeParams(newParams: TelegramThemeParams) {
        _themeParams.value = newParams
        addLog(LogLevel.INFO, "Updated Telegram Theme parameters")
    }

    fun addLog(level: LogLevel, message: String) {
        val item = ConsoleLogItem(
            timestamp = dateFormat.format(Date()),
            level = level,
            message = message
        )
        _consoleLogs.update { list ->
            (list + item).takeLast(200)
        }
    }

    fun clearLogs() {
        _consoleLogs.value = emptyList()
    }

    fun updateMainButtonFromJson(json: JSONObject) {
        val isVisible = json.optBoolean("isVisible", false)
        val text = json.optString("text", "CONTINUE")
        val color = json.optString("color", "#2481CC")
        val textColor = json.optString("textColor", "#FFFFFF")
        val isActive = json.optBoolean("isActive", true)
        val isProgressVisible = json.optBoolean("isProgressVisible", false)

        _mainButtonState.value = MainButtonState(
            isVisible = isVisible,
            text = text,
            color = color,
            textColor = textColor,
            isActive = isActive,
            isProgressVisible = isProgressVisible
        )
    }

    fun updateBackButtonState(visible: Boolean) {
        _hasBackButton.value = visible
    }

    fun onNativeMainButtonClick() {
        addLog(LogLevel.BRIDGE, "Native MainButton clicked -> triggering Telegram.WebApp.MainButton._triggerClick()")
        activeWebView?.evaluateJavascript("window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.MainButton && window.Telegram.WebApp.MainButton._triggerClick();", null)
    }

    fun onNativeBackButtonClick() {
        addLog(LogLevel.BRIDGE, "Native BackButton clicked -> triggering Telegram.WebApp.BackButton._triggerClick()")
        activeWebView?.evaluateJavascript("window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.BackButton && window.Telegram.WebApp.BackButton._triggerClick();", null)
    }

    fun setAlertMessage(msg: String?) {
        _alertMessage.value = msg
    }

    fun setReceivedData(data: String) {
        _receivedData.value = data
        addLog(LogLevel.BRIDGE, "Received sendData payload from WebApp: $data")
    }

    fun clearReceivedData() {
        _receivedData.value = null
    }

    fun reloadWebView() {
        addLog(LogLevel.INFO, "Reloading WebApp engine...")
        try {
            val currentHtml = _htmlCode.value
            activeWebView?.let { wv ->
                wv.stopLoading()
                wv.clearCache(true)
                val js = com.example.bridge.TelegramWebAppJS.generateInjectionScript(_user.value, _themeParams.value)
                wv.evaluateJavascript(js, null)
                wv.loadDataWithBaseURL("https://web.telegram.org/?v=${System.currentTimeMillis()}", currentHtml, "text/html", "UTF-8", null)
            }
        } catch (e: Exception) {
            addLog(LogLevel.WARNING, "Safe reload exception: ${e.message}")
        }
    }

    fun reloadToLatestBuild() {
        addLog(LogLevel.INFO, "Reloading SREYMARA ecosystem to latest build & implementations...")
        try {
            _activeTab.value = 0
            val latestHtml = SampleMiniApps.getDefaultHtml(getApplication())
            _selectedTemplateId.value = "google_ai_studio"
            _htmlCode.value = latestHtml
            _mainButtonState.value = MainButtonState()
            _hasBackButton.value = false
            _alertMessage.value = null
            _receivedData.value = null
            
            activeWebView?.let { wv ->
                wv.stopLoading()
                wv.clearCache(true)
                val js = com.example.bridge.TelegramWebAppJS.generateInjectionScript(_user.value, _themeParams.value)
                wv.evaluateJavascript(js, null)
                wv.loadDataWithBaseURL("https://web.telegram.org/?v=${System.currentTimeMillis()}", latestHtml, "text/html", "UTF-8", null)
            }
            try {
                Toast.makeText(getApplication(), "⚡ Reloaded to latest build & implementations", Toast.LENGTH_SHORT).show()
            } catch (_: Exception) {}
        } catch (e: Exception) {
            addLog(LogLevel.WARNING, "Safe reload exception: ${e.message}")
        }
    }

    fun resetToInitialState() {
        reloadToLatestBuild()
    }

    fun onResumeWebView() {
        try {
            activeWebView?.onResume()
            addLog(LogLevel.DEBUG, "WebView resumed cleanly")
        } catch (e: Exception) {
            addLog(LogLevel.WARNING, "Safe resume exception: ${e.message}")
        }
    }

    fun onPauseWebView() {
        try {
            activeWebView?.onPause()
            addLog(LogLevel.DEBUG, "WebView paused cleanly")
        } catch (e: Exception) {
            addLog(LogLevel.WARNING, "Safe pause exception: ${e.message}")
        }
    }

    override fun onCleared() {
        super.onCleared()
        try {
            activeWebView?.apply {
                stopLoading()
                onPause()
                pauseTimers()
                clearHistory()
                loadUrl("about:blank")
                removeAllViews()
                destroy()
            }
            activeWebView = null
        } catch (e: Exception) {
            // Ignore on clear
        }
    }
}
