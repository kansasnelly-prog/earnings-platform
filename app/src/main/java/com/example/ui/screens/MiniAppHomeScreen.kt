package com.example.ui.screens

import android.graphics.Color as AndroidColor
import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.BugReport
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Code
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.ContentPaste
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Smartphone
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.PrimaryTabRow
import androidx.compose.material3.Scaffold
import androidx.compose.material3.ScrollableTabRow
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex
import com.example.data.SampleMiniApps
import com.example.model.LogLevel
import com.example.model.TelegramThemeParams
import com.example.model.TelegramUser
import com.example.ui.components.WebViewContainer
import com.example.ui.viewmodel.MiniAppViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MiniAppHomeScreen(viewModel: MiniAppViewModel) {
    val htmlCode by viewModel.htmlCode.collectAsState()
    val selectedTemplateId by viewModel.selectedTemplateId.collectAsState()
    val user by viewModel.user.collectAsState()
    val themeParams by viewModel.themeParams.collectAsState()
    val mainButtonState by viewModel.mainButtonState.collectAsState()
    val hasBackButton by viewModel.hasBackButton.collectAsState()
    val consoleLogs by viewModel.consoleLogs.collectAsState()
    val activeTab by viewModel.activeTab.collectAsState()
    val alertMessage by viewModel.alertMessage.collectAsState()
    val receivedData by viewModel.receivedData.collectAsState()

    val clipboardManager = LocalClipboardManager.current

    val telegramDarkBlue = Color(0xFF17212B)
    val telegramCardBg = Color(0xFF232E3C)
    val telegramAccentBlue = Color(0xFF2481CC)

    // Parse main button color
    val executiveObsidianBg = Color(0xFF0A0A11)
    val goldAccentColor = Color(0xFFD4AF37)
    val goldLightColor = Color(0xFFFFF2A1)

    val mainBtnColor = try {
        Color(AndroidColor.parseColor(mainButtonState.color))
    } catch (e: Exception) {
        telegramAccentBlue
    }

    val mainBtnTextColor = try {
        Color(AndroidColor.parseColor(mainButtonState.textColor))
    } catch (e: Exception) {
        Color.White
    }

    val activeWebView = viewModel.activeWebView
    BackHandler(enabled = true) {
        if (activeTab != 0) {
            viewModel.setActiveTab(0)
            viewModel.addLog(LogLevel.INFO, "Back button pressed: returned to SREYMARA Main Hub.")
        } else if (activeWebView != null) {
            activeWebView.evaluateJavascript(
                """
                (function() {
                    if (window.handleInAppBack && window.handleInAppBack()) {
                        return true;
                    }
                    var modals = document.querySelectorAll('.fixed:not(.hidden)');
                    var closedAny = false;
                    for (var i = 0; i < modals.length; i++) {
                        if (modals[i].id && (modals[i].id.includes('modal') || modals[i].id === 'full-store-page')) {
                            modals[i].classList.add('hidden');
                            closedAny = true;
                        }
                    }
                    if (closedAny) return true;
                    if (window.history.length > 1) {
                        window.history.back();
                        return true;
                    }
                    return false;
                })()
                """.trimIndent()
            ) { result ->
                if (result == "false" || result == "null") {
                    viewModel.addLog(LogLevel.INFO, "Back press handled at root.")
                }
            }
        } else {
            viewModel.addLog(LogLevel.INFO, "Back press handled cleanly.")
        }
    }

    val handleTabSwitch: (Int) -> Unit = { tabIndex ->
        try {
            viewModel.setActiveTab(tabIndex)
        } catch (e: Exception) {
            android.util.Log.e("TabNavigation", "Tab Navigation Error: ${e.message}", e)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                modifier = Modifier.zIndex(10f),
                navigationIcon = {
                    if (activeTab != 0) {
                        IconButton(onClick = { viewModel.setActiveTab(0) }) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "Close to Main Hub",
                                tint = Color.White
                            )
                        }
                    }
                },
                title = {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.clickable { viewModel.setActiveTab(0) }
                    ) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(CircleShape)
                                .background(Color(0xFF2A1F13))
                                .border(1.dp, goldAccentColor, CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "👑",
                                fontSize = 18.sp
                            )
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                text = "SREYMARA Executive Hub",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = goldLightColor
                            )
                            Text(
                                text = "EXECUTIVES WEB2 / WEB3 ECOSYSTEM",
                                fontSize = 9.sp,
                                fontWeight = FontWeight.SemiBold,
                                letterSpacing = 1.sp,
                                color = Color(0xFFE0E0E0)
                            )
                        }
                    }
                },
                actions = {
                    if (activeTab != 0) {
                        IconButton(
                            onClick = { viewModel.setActiveTab(0) },
                            modifier = Modifier.padding(end = 2.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Home,
                                contentDescription = "Minimize to Main Hub",
                                tint = goldAccentColor
                            )
                        }
                    }
                    IconButton(
                        onClick = { viewModel.reloadToLatestBuild() },
                        modifier = Modifier.padding(end = 4.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "Reload Latest Build & Implementations",
                            tint = goldAccentColor
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = executiveObsidianBg
                )
            )
        },
        containerColor = executiveObsidianBg
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            // Seven-Color Rainbow Ambient Lighting Accent Bar
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(3.dp)
                    .background(
                        brush = androidx.compose.ui.graphics.Brush.horizontalGradient(
                            colors = listOf(
                                Color(0xFFFF0000), // Red
                                Color(0xFFFF7F00), // Orange
                                Color(0xFFFFFF00), // Yellow
                                Color(0xFF00FF00), // Green
                                Color(0xFF00FFFF), // Cyan
                                Color(0xFF0000FF), // Blue
                                Color(0xFF8B00FF)  // Purple
                            )
                        )
                    )
            )

            // Tab Header Row with Safe Pointer Events & High Z-Index
            ScrollableTabRow(
                selectedTabIndex = activeTab,
                containerColor = telegramDarkBlue,
                contentColor = telegramAccentBlue,
                edgePadding = 12.dp,
                modifier = Modifier
                    .fillMaxWidth()
                    .zIndex(10f)
            ) {
                Tab(
                    selected = activeTab == 0,
                    onClick = { handleTabSwitch(0) },
                    text = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Smartphone, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("📱 SREYMARA Main Hub", fontWeight = FontWeight.Bold, color = goldLightColor)
                        }
                    }
                )
                Tab(
                    selected = activeTab == 1,
                    onClick = { handleTabSwitch(1) },
                    text = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Code, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("HTML Editor")
                        }
                    }
                )
                Tab(
                    selected = activeTab == 2,
                    onClick = { handleTabSwitch(2) },
                    text = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Person, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Mock User & Theme")
                        }
                    }
                )
                Tab(
                    selected = activeTab == 3,
                    onClick = { handleTabSwitch(3) },
                    text = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.BugReport, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Console (${consoleLogs.size})")
                        }
                    }
                )
                Tab(
                    selected = activeTab == 4,
                    onClick = { handleTabSwitch(4) },
                    text = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.AutoAwesome, contentDescription = null, modifier = Modifier.size(16.dp), tint = Color(0xFFF59E0B))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Gemini AI", color = Color(0xFFF59E0B), fontWeight = FontWeight.Bold)
                        }
                    }
                )
                Tab(
                    selected = activeTab == 5,
                    onClick = { handleTabSwitch(5) },
                    text = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("🌐", fontSize = 14.sp)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Linux AI Browser", color = Color(0xFF38BDF8), fontWeight = FontWeight.Bold)
                        }
                    }
                )
            }

            // Tab Content
            Box(modifier = Modifier.weight(1f)) {
                when (activeTab) {
                    0 -> MiniAppViewTab(
                        htmlContent = htmlCode,
                        user = user,
                        themeParams = themeParams,
                        hasBackButton = hasBackButton,
                        mainButtonState = mainButtonState,
                        mainBtnColor = mainBtnColor,
                        mainBtnTextColor = mainBtnTextColor,
                        viewModel = viewModel
                    )
                    1 -> HtmlEditorTab(
                        htmlCode = htmlCode,
                        selectedTemplateId = selectedTemplateId,
                        onCodeChange = { viewModel.updateHtmlCode(it) },
                        onSelectTemplate = { viewModel.selectTemplate(it) },
                        onRenderClick = { viewModel.setActiveTab(0) },
                        onCloseToMainHub = { viewModel.setActiveTab(0) },
                        clipboardManager = clipboardManager
                    )
                    2 -> ConfigTab(
                        user = user,
                        themeParams = themeParams,
                        onUserChange = { viewModel.updateUser(it) },
                        onThemeChange = { viewModel.updateThemeParams(it) },
                        onCloseToMainHub = { viewModel.setActiveTab(0) }
                    )
                    3 -> ConsoleTab(
                        logs = consoleLogs,
                        receivedData = receivedData,
                        onClearLogs = { viewModel.clearLogs() },
                        onClearReceivedData = { viewModel.clearReceivedData() },
                        onCloseToMainHub = { viewModel.setActiveTab(0) },
                        clipboardManager = clipboardManager
                    )
                    4 -> GeminiManagerTab(
                        viewModel = viewModel
                    )
                    5 -> LinuxBrowserTab(
                        viewModel = viewModel
                    )
                }
            }
        }
    }

    // Native Telegram Alert Dialog
    if (alertMessage != null) {
        AlertDialog(
            onDismissRequest = { viewModel.setAlertMessage(null) },
            title = { Text("Telegram WebApp Alert", color = Color.White) },
            text = { Text(alertMessage ?: "", color = Color(0xFFD0D7DE)) },
            confirmButton = {
                Button(
                    onClick = { viewModel.setAlertMessage(null) },
                    colors = ButtonDefaults.buttonColors(containerColor = telegramAccentBlue)
                ) {
                    Text("OK")
                }
            },
            containerColor = telegramCardBg
        )
    }
}

@Composable
fun MiniAppViewTab(
    htmlContent: String,
    user: TelegramUser,
    themeParams: TelegramThemeParams,
    hasBackButton: Boolean,
    mainButtonState: com.example.model.MainButtonState,
    mainBtnColor: Color,
    mainBtnTextColor: Color,
    viewModel: MiniAppViewModel
) {
    val headerBg = Color(0xFF0A0A11)
    val goldAccent = Color(0xFFD4AF37)
    val goldLight = Color(0xFFFFF2A1)

    Column(modifier = Modifier.fillMaxSize()) {
        // Simulated Native Executive WebApp Top Header Bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(headerBg)
                .border(width = 1.dp, color = Color(0x55D4AF37))
                .padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                if (hasBackButton) {
                    IconButton(
                        onClick = { viewModel.onNativeBackButtonClick() },
                        modifier = Modifier.size(32.dp)
                    ) {
                        Text("🦅", fontSize = 16.sp)
                    }
                    Spacer(modifier = Modifier.width(6.dp))
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("🛡️", fontSize = 16.sp)
                    Spacer(modifier = Modifier.width(6.dp))
                    Column {
                        Text(
                            text = "SREYMARA",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = goldLight,
                            letterSpacing = 2.sp,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Text(
                            text = "EXECUTIVES WEB2 / WEB3 ECOSYSTEM",
                            fontSize = 8.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFFE0E0E0),
                            letterSpacing = 1.sp
                        )
                    }
                }
            }

            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(
                    onClick = { viewModel.reloadToLatestBuild() },
                    modifier = Modifier.size(32.dp)
                ) {
                    Text("♾️", fontSize = 16.sp)
                }
                IconButton(
                    onClick = { viewModel.addLog(LogLevel.INFO, "SREYMARA Menu Options clicked") },
                    modifier = Modifier.size(32.dp)
                ) {
                    Text("🔑", fontSize = 16.sp)
                }
            }
        }

        // Active WebView Area
        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
        ) {
            WebViewContainer(
                htmlContent = htmlContent,
                user = user,
                themeParams = themeParams,
                modifier = Modifier.fillMaxSize(),
                onLog = { level, msg -> viewModel.addLog(level, msg) },
                onMainButtonStateChanged = { viewModel.updateMainButtonFromJson(it) },
                onBackButtonStateChanged = { viewModel.updateBackButtonState(it) },
                onSendDataReceived = { viewModel.setReceivedData(it) },
                onCloseRequested = { viewModel.addLog(LogLevel.INFO, "App closed requested by Telegram.WebApp.close()") },
                onShowAlertRequested = { viewModel.setAlertMessage(it) },
                onWebViewCreated = { webView -> viewModel.activeWebView = webView }
            )
        }

        // Native Sticky Telegram MainButton (When activated by WebApp JS)
        AnimatedVisibility(
            visible = mainButtonState.isVisible,
            enter = fadeIn(),
            exit = fadeOut()
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF0F172A))
                    .padding(12.dp)
            ) {
                Button(
                    onClick = {
                        if (mainButtonState.isActive) {
                            viewModel.onNativeMainButtonClick()
                        }
                    },
                    enabled = mainButtonState.isActive,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp),
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = mainBtnColor,
                        contentColor = mainBtnTextColor,
                        disabledContainerColor = mainBtnColor.copy(alpha = 0.5f)
                    )
                ) {
                    if (mainButtonState.isProgressVisible) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(22.dp),
                            color = mainBtnTextColor,
                            strokeWidth = 2.dp
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                    }
                    Text(
                        text = mainButtonState.text.uppercase(),
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 0.5.sp
                    )
                }
            }
        }
    }
}

@Composable
fun HtmlEditorTab(
    htmlCode: String,
    selectedTemplateId: String,
    onCodeChange: (String) -> Unit,
    onSelectTemplate: (String) -> Unit,
    onRenderClick: () -> Unit,
    onCloseToMainHub: () -> Unit,
    clipboardManager: androidx.compose.ui.platform.ClipboardManager
) {
    var isRawEditorActive by remember { mutableStateOf(htmlCode.length <= 30000) }
    var localEditableCode by remember(htmlCode) { 
        mutableStateOf(if (htmlCode.length <= 30000) htmlCode else htmlCode.take(20000)) 
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        // Section Header with Standard Close & Minimize Controls
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Code, contentDescription = null, tint = Color(0xFF64B5F6), modifier = Modifier.size(20.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("HTML SOURCE EDITOR", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color.White)
            }
            Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                IconButton(onClick = onCloseToMainHub, modifier = Modifier.size(32.dp)) {
                    Icon(Icons.Default.Home, contentDescription = "Minimize to Main Hub", tint = Color(0xFFD4AF37), modifier = Modifier.size(18.dp))
                }
                IconButton(onClick = onCloseToMainHub, modifier = Modifier.size(32.dp)) {
                    Icon(Icons.Default.Close, contentDescription = "Close to Main Hub", tint = Color.White, modifier = Modifier.size(18.dp))
                }
            }
        }

        Text(
            text = "Template Presets",
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold,
            color = Color(0xFF708499)
        )
        Spacer(modifier = Modifier.height(8.dp))

        // Preset Chips
        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            items(SampleMiniApps.templates) { template ->
                val isSelected = selectedTemplateId == template.id
                Card(
                    modifier = Modifier.clickable { 
                        try {
                            onSelectTemplate(template.id) 
                        } catch (e: Exception) {
                            android.util.Log.e("HtmlEditor", "Error selecting template: ${e.message}")
                        }
                    },
                    colors = CardDefaults.cardColors(
                        containerColor = if (isSelected) Color(0xFF2481CC) else Color(0xFF232E3C)
                    ),
                    shape = RoundedCornerShape(20.dp)
                ) {
                    Text(
                        text = template.title,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        color = Color.White,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Editor Actions Toolbar
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "HTML / CSS / JS Source",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF708499)
                )
                Text(
                    text = "Size: ${htmlCode.length} chars (~${String.format("%.2f", htmlCode.length / 1024.0)} KB)",
                    fontSize = 10.sp,
                    color = Color(0xFF38BDF8)
                )
            }

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                IconButton(
                    onClick = {
                        try {
                            val clipText = clipboardManager.getText()?.text
                            if (!clipText.isNullOrEmpty()) {
                                localEditableCode = clipText
                                onCodeChange(clipText)
                            }
                        } catch (e: Exception) {
                            android.util.Log.e("HtmlEditor", "Error pasting: ${e.message}")
                        }
                    },
                    modifier = Modifier.size(32.dp)
                ) {
                    Icon(Icons.Default.ContentPaste, contentDescription = "Paste Code", tint = Color(0xFF64B5F6))
                }
                IconButton(
                    onClick = {
                        try {
                            clipboardManager.setText(AnnotatedString(htmlCode))
                        } catch (e: Exception) {
                            android.util.Log.e("HtmlEditor", "Error copying: ${e.message}")
                        }
                    },
                    modifier = Modifier.size(32.dp)
                ) {
                    Icon(Icons.Default.ContentCopy, contentDescription = "Copy Code", tint = Color(0xFF64B5F6))
                }
                IconButton(
                    onClick = {
                        localEditableCode = ""
                        onCodeChange("")
                    },
                    modifier = Modifier.size(32.dp)
                ) {
                    Icon(Icons.Default.Delete, contentDescription = "Clear Code", tint = Color(0xFFE53935))
                }
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Safe Code Editor / Snippet View
        if (htmlCode.length > 30000 && !isRawEditorActive) {
            Card(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
                shape = RoundedCornerShape(12.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF232E3C))
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "⚡ High-Performance Ecosystem Bundle (${htmlCode.length} chars)",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF10B981)
                        )
                        TextButton(
                            onClick = { isRawEditorActive = true }
                        ) {
                            Text("Edit Snippet", fontSize = 11.sp, color = Color(0xFF38BDF8))
                        }
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxWidth()
                            .background(Color(0xFF070B14), RoundedCornerShape(8.dp))
                            .padding(8.dp)
                    ) {
                        Text(
                            text = htmlCode.take(2500) + "\n\n... [${htmlCode.length - 2500} MORE CHARACTERS RUNNING IN SREYMARA HUB] ...",
                            fontFamily = FontFamily.Monospace,
                            fontSize = 11.sp,
                            color = Color(0xFF94A3B8)
                        )
                    }
                }
            }
        } else {
            // Code TextField for active editable source
            OutlinedTextField(
                value = localEditableCode,
                onValueChange = { newText ->
                    localEditableCode = newText
                    onCodeChange(newText)
                },
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
                textStyle = MaterialTheme.typography.bodySmall.copy(
                    fontFamily = FontFamily.Monospace,
                    fontSize = 12.sp,
                    color = Color(0xFFE2E8F0)
                ),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = Color(0xFF0F172A),
                    unfocusedContainerColor = Color(0xFF0F172A),
                    focusedBorderColor = Color(0xFF2481CC),
                    unfocusedBorderColor = Color(0xFF232E3C)
                ),
                shape = RoundedCornerShape(12.dp)
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Render Action Button
        Button(
            onClick = {
                try {
                    onRenderClick()
                } catch (e: Exception) {
                    android.util.Log.e("HtmlEditor", "Error rendering: ${e.message}")
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2481CC)),
            shape = RoundedCornerShape(10.dp)
        ) {
            Icon(Icons.Default.PlayArrow, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text("RENDER & RUN MINI APP", fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun ConfigTab(
    user: TelegramUser,
    themeParams: TelegramThemeParams,
    onUserChange: (TelegramUser) -> Unit,
    onThemeChange: (TelegramThemeParams) -> Unit,
    onCloseToMainHub: () -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            // Section Header with Standard Close & Minimize Controls
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 4.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Person, contentDescription = null, tint = Color(0xFF64B5F6), modifier = Modifier.size(20.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("USER & THEME CONFIGURATION", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color.White)
                }
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    IconButton(onClick = onCloseToMainHub, modifier = Modifier.size(32.dp)) {
                        Icon(Icons.Default.Home, contentDescription = "Minimize to Main Hub", tint = Color(0xFFD4AF37), modifier = Modifier.size(18.dp))
                    }
                    IconButton(onClick = onCloseToMainHub, modifier = Modifier.size(32.dp)) {
                        Icon(Icons.Default.Close, contentDescription = "Close to Main Hub", tint = Color.White, modifier = Modifier.size(18.dp))
                    }
                }
            }
        }

        item {
            Text(
                text = "Mock Telegram User Profile",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
            Text(
                text = "Passed directly into Telegram.WebApp.initDataUnsafe.user inside JS",
                fontSize = 12.sp,
                color = Color(0xFF708499)
            )
        }

        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF232E3C)),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedTextField(
                        value = user.firstName,
                        onValueChange = { onUserChange(user.copy(firstName = it)) },
                        label = { Text("First Name") },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Color(0xFF2481CC))
                    )

                    OutlinedTextField(
                        value = user.lastName,
                        onValueChange = { onUserChange(user.copy(lastName = it)) },
                        label = { Text("Last Name") },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Color(0xFF2481CC))
                    )

                    OutlinedTextField(
                        value = user.username,
                        onValueChange = { onUserChange(user.copy(username = it)) },
                        label = { Text("Username (@handle)") },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Color(0xFF2481CC))
                    )

                    OutlinedTextField(
                        value = user.id.toString(),
                        onValueChange = {
                            val newId = it.toLongOrNull() ?: user.id
                            onUserChange(user.copy(id = newId))
                        },
                        label = { Text("User Telegram ID") },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Color(0xFF2481CC))
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Telegram Premium Status", color = Color.White, fontSize = 14.sp)
                        Switch(
                            checked = user.isPremium,
                            onCheckedChange = { onUserChange(user.copy(isPremium = it)) },
                            colors = SwitchDefaults.colors(checkedThumbColor = Color(0xFF2481CC))
                        )
                    }
                }
            }
        }

        item {
            Text(
                text = "Telegram Theme Parameters",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
            Text(
                text = "Controls themeParams exposed to window.Telegram.WebApp.themeParams",
                fontSize = 12.sp,
                color = Color(0xFF708499)
            )
        }

        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF232E3C)),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text("Theme Color Presets", fontSize = 13.sp, color = Color(0xFF708499))

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(
                            onClick = {
                                onThemeChange(
                                    TelegramThemeParams(
                                        bgColor = "#17212B",
                                        textColor = "#FFFFFF",
                                        hintColor = "#708499",
                                        buttonColor = "#2481CC",
                                        buttonTextColor = "#FFFFFF",
                                        secondaryBgColor = "#232E3C",
                                        headerBgColor = "#17212B"
                                    )
                                )
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF17212B)),
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("Night (Dark)", fontSize = 11.sp)
                        }

                        Button(
                            onClick = {
                                onThemeChange(
                                    TelegramThemeParams(
                                        bgColor = "#FFFFFF",
                                        textColor = "#000000",
                                        hintColor = "#8E8E93",
                                        buttonColor = "#3390EC",
                                        buttonTextColor = "#FFFFFF",
                                        secondaryBgColor = "#F4F4F5",
                                        headerBgColor = "#527DA3"
                                    )
                                )
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF3390EC)),
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("Classic (Light)", fontSize = 11.sp)
                        }
                    }

                    OutlinedTextField(
                        value = themeParams.bgColor,
                        onValueChange = { onThemeChange(themeParams.copy(bgColor = it)) },
                        label = { Text("Background Color (bg_color)") },
                        modifier = Modifier.fillMaxWidth()
                    )

                    OutlinedTextField(
                        value = themeParams.buttonColor,
                        onValueChange = { onThemeChange(themeParams.copy(buttonColor = it)) },
                        label = { Text("Button Color (button_color)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
        }
    }
}

@Composable
fun ConsoleTab(
    logs: List<com.example.model.ConsoleLogItem>,
    receivedData: String?,
    onClearLogs: () -> Unit,
    onClearReceivedData: () -> Unit,
    onCloseToMainHub: () -> Unit,
    clipboardManager: androidx.compose.ui.platform.ClipboardManager
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        // Section Header with Standard Close & Minimize Controls
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.BugReport, contentDescription = null, tint = Color(0xFF34D399), modifier = Modifier.size(20.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("EVENT CONSOLE & STREAM", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color.White)
            }
            Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                IconButton(onClick = onCloseToMainHub, modifier = Modifier.size(32.dp)) {
                    Icon(Icons.Default.Home, contentDescription = "Minimize to Main Hub", tint = Color(0xFFD4AF37), modifier = Modifier.size(18.dp))
                }
                IconButton(onClick = onCloseToMainHub, modifier = Modifier.size(32.dp)) {
                    Icon(Icons.Default.Close, contentDescription = "Close to Main Hub", tint = Color.White, modifier = Modifier.size(18.dp))
                }
            }
        }
        // Last Received sendData Banner
        if (receivedData != null) {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF065F46)),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp)
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Received sendData() Payload:",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFFA7F3D0)
                        )
                        Text(
                            text = receivedData,
                            fontSize = 13.sp,
                            fontFamily = FontFamily.Monospace,
                            color = Color.White
                        )
                    }
                    IconButton(onClick = onClearReceivedData) {
                        Icon(Icons.Default.Clear, contentDescription = "Dismiss", tint = Color.White)
                    }
                }
            }
        }

        // Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Console & Event Stream",
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )

            Row {
                IconButton(
                    onClick = {
                        val text = logs.joinToString("\n") { "[${it.timestamp}] [${it.level}] ${it.message}" }
                        clipboardManager.setText(AnnotatedString(text))
                    }
                ) {
                    Icon(Icons.Default.ContentCopy, contentDescription = "Copy Logs", tint = Color(0xFF64B5F6))
                }
                IconButton(onClick = onClearLogs) {
                    Icon(Icons.Default.Delete, contentDescription = "Clear Logs", tint = Color(0xFFE53935))
                }
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Logs Stream
        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFF0E1621)),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
        ) {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(12.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                items(logs) { log ->
                    val levelColor = when (log.level) {
                        LogLevel.ERROR -> Color(0xFFF87171)
                        LogLevel.WARNING -> Color(0xFFFBBF24)
                        LogLevel.BRIDGE -> Color(0xFF60A5FA)
                        LogLevel.DEBUG -> Color(0xFFA78BFA)
                        else -> Color(0xFF34D399)
                    }

                    Row(modifier = Modifier.fillMaxWidth()) {
                        Text(
                            text = log.timestamp,
                            fontSize = 10.sp,
                            fontFamily = FontFamily.Monospace,
                            color = Color(0xFF64748B),
                            modifier = Modifier.width(80.dp)
                        )
                        Text(
                            text = "[${log.level.name}]",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace,
                            color = levelColor,
                            modifier = Modifier.width(60.dp)
                        )
                        Text(
                            text = log.message,
                            fontSize = 11.sp,
                            fontFamily = FontFamily.Monospace,
                            color = Color(0xFFE2E8F0),
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }
        }
    }
}
