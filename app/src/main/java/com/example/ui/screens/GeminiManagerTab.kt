package com.example.ui.screens

import android.content.Context
import android.content.Intent
import android.speech.tts.TextToSpeech
import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.text.selection.DisableSelection
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Code
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.ContentPaste
import androidx.compose.material.icons.filled.DeleteOutline
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.FileDownload
import androidx.compose.material.icons.filled.Fullscreen
import androidx.compose.material.icons.filled.FullscreenExit
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Key
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.OpenWith
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.example.model.GeminiChatMessage
import com.example.ui.viewmodel.MiniAppViewModel
import java.util.Locale
import kotlin.math.roundToInt

@Composable
fun GeminiManagerTab(viewModel: MiniAppViewModel) {
    val geminiMessages by viewModel.geminiMessages.collectAsState()
    val isThinking by viewModel.isGeminiThinking.collectAsState()
    val currentApiKey by viewModel.geminiApiKey.collectAsState()

    var apiKeyInput by remember(currentApiKey) { mutableStateOf(currentApiKey) }
    var showKeyConfig by remember { mutableStateOf(false) }
    var inputText by remember { mutableStateOf("") }
    var copiedMessageIndex by remember { mutableStateOf<Int?>(null) }
    var selectedModel by remember { mutableStateOf("Flash") }
    var showModelMenu by remember { mutableStateOf(false) }
    var showPlusMenu by remember { mutableStateOf(false) }
    var isExpandedInput by remember { mutableStateOf(false) }

    // Movable Floating Keyboard / Input Box Offset
    var floatingOffsetX by remember { mutableFloatStateOf(0f) }
    var floatingOffsetY by remember { mutableFloatStateOf(0f) }
    var isFloatingMode by remember { mutableStateOf(false) }

    val listState = rememberLazyListState()
    val clipboardManager = LocalClipboardManager.current
    val context = LocalContext.current

    // Text To Speech engine
    var ttsEngine by remember { mutableStateOf<TextToSpeech?>(null) }
    DisposableEffect(context) {
        val tts = TextToSpeech(context) { status ->
            if (status == TextToSpeech.SUCCESS) {
                // Initialized
            }
        }
        tts.language = Locale.US
        ttsEngine = tts
        onDispose {
            tts.stop()
            tts.shutdown()
        }
    }

    // Color Palette matching modern Gemini Dark Theme + SREYMARA Gold Accents
    val geminiDarkCanvas = Color(0xFF0F1117)
    val geminiPillBg = Color(0xFF1E1F20)
    val geminiPillBorder = Color(0xFF333842)
    val geminiBlueAccent = Color(0xFF388BFF)
    val geminiGoldAccent = Color(0xFFF59E0B)
    val geminiGoldLight = Color(0xFFFFF2A1)
    val userBubbleColor = Color(0xFF1E293B)
    val aiResponseCardBg = Color(0xFF131722)

    LaunchedEffect(geminiMessages.size, isThinking) {
        if (geminiMessages.isNotEmpty()) {
            listState.animateScrollToItem(geminiMessages.size - 1)
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(geminiDarkCanvas)
            .imePadding() // CRITICAL: Automatically pushes input above soft keyboard!
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 10.dp, vertical = 6.dp)
        ) {
            // ==================== TOP EXECUTIVE HEADER ====================
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 6.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF161B26)),
                shape = RoundedCornerShape(14.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.dp, Color(0x33F59E0B), RoundedCornerShape(14.dp))
                        .padding(10.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            modifier = Modifier.weight(1f),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(CircleShape)
                                    .background(
                                        Brush.linearGradient(
                                            colors = listOf(Color(0xFFF59E0B), Color(0xFF2563EB))
                                        )
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.AutoAwesome,
                                    contentDescription = "Gemini AI",
                                    tint = Color.White,
                                    modifier = Modifier.size(20.dp)
                                )
                            }

                            Spacer(modifier = Modifier.width(8.dp))

                            Column {
                                Text(
                                    text = "GEMINI VIP EXECUTIVE CO-PILOT",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = geminiGoldLight
                                )
                                Text(
                                    text = "Gemini 3.7 Flash • Full AI Assistant & Code Fixer",
                                    fontSize = 9.5.sp,
                                    fontWeight = FontWeight.Normal,
                                    color = Color(0xFF94A3B8)
                                )
                            }
                        }

                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            // Movable Keyboard / Screen Mode Toggle
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(if (isFloatingMode) Color(0xFF2563EB) else Color(0xFF1E293B))
                                    .clickable { isFloatingMode = !isFloatingMode }
                                    .padding(horizontal = 8.dp, vertical = 5.dp)
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = Icons.Default.OpenWith,
                                        contentDescription = "Movable Box",
                                        tint = if (isFloatingMode) Color.White else geminiGoldAccent,
                                        modifier = Modifier.size(13.dp)
                                    )
                                    Spacer(modifier = Modifier.width(3.dp))
                                    Text(
                                        text = if (isFloatingMode) "Docked" else "Movable",
                                        fontSize = 10.sp,
                                        color = Color.White,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }

                            // Key Config Button
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color(0xFF1E293B))
                                    .border(1.dp, Color(0x66F59E0B), RoundedCornerShape(8.dp))
                                    .clickable { showKeyConfig = !showKeyConfig }
                                    .padding(horizontal = 8.dp, vertical = 5.dp)
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = Icons.Default.Key,
                                        contentDescription = "Configure Key",
                                        tint = geminiGoldAccent,
                                        modifier = Modifier.size(13.dp)
                                    )
                                    Spacer(modifier = Modifier.width(3.dp))
                                    Text(
                                        text = if (showKeyConfig) "Hide" else "Key",
                                        fontSize = 10.sp,
                                        color = geminiGoldLight,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }

                            // Home Minimize Button
                            IconButton(
                                onClick = { viewModel.setActiveTab(0) },
                                modifier = Modifier.size(28.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Home,
                                    contentDescription = "Minimize to Main Hub",
                                    tint = geminiGoldAccent,
                                    modifier = Modifier.size(16.dp)
                                )
                            }

                            // Standard Close Button
                            IconButton(
                                onClick = { viewModel.setActiveTab(0) },
                                modifier = Modifier.size(28.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Close,
                                    contentDescription = "Close to Main Hub",
                                    tint = Color.White,
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                        }
                    }

                    // API Key Settings Drawer
                    AnimatedVisibility(
                        visible = showKeyConfig || currentApiKey.isBlank(),
                        enter = fadeIn(),
                        exit = fadeOut()
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 8.dp)
                        ) {
                            Text(
                                text = "Gemini API Key Authentication:",
                                fontSize = 10.sp,
                                color = Color(0xFFE2E8F0),
                                fontWeight = FontWeight.SemiBold
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                OutlinedTextField(
                                    value = apiKeyInput,
                                    onValueChange = { apiKeyInput = it },
                                    placeholder = {
                                        Text("Paste Gemini API Key", fontSize = 10.sp, color = Color(0xFF64748B))
                                    },
                                    modifier = Modifier
                                        .weight(1f)
                                        .height(42.dp),
                                    trailingIcon = {
                                        IconButton(
                                            onClick = {
                                                val clip = clipboardManager.getText()?.text
                                                if (!clip.isNullOrEmpty()) {
                                                    apiKeyInput = clip.trim()
                                                }
                                            }
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.ContentPaste,
                                                contentDescription = "Paste",
                                                tint = geminiGoldAccent,
                                                modifier = Modifier.size(15.dp)
                                            )
                                        }
                                    },
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = geminiGoldAccent,
                                        unfocusedBorderColor = Color(0xFF475569),
                                        focusedTextColor = Color.White,
                                        unfocusedTextColor = Color.White,
                                        focusedContainerColor = Color(0xFF0B0F19),
                                        unfocusedContainerColor = Color(0xFF0B0F19)
                                    ),
                                    singleLine = true,
                                    shape = RoundedCornerShape(8.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Button(
                                    onClick = {
                                        viewModel.updateGeminiApiKey(apiKeyInput)
                                        showKeyConfig = false
                                        Toast.makeText(context, "API Key Saved!", Toast.LENGTH_SHORT).show()
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                                    shape = RoundedCornerShape(8.dp),
                                    modifier = Modifier.height(42.dp)
                                ) {
                                    Text("Save", color = Color.Black, fontWeight = FontWeight.Bold, fontSize = 10.sp)
                                }
                            }
                        }
                    }
                }
            }

            // ==================== QUICK STRATEGY SUGGESTIONS ====================
            val suggestions = listOf(
                "🚀 Build Standalone APK (GitHub Actions)",
                "⚡ Optimize Solana SPL Vault Yields",
                "🎬 Maximize earnings.ink Cinema Profits",
                "🛠️ Audit Loaded HTML & Fix Code",
                "🤖 Configure @OnlineCustomerOptimizeTasksBot",
                "💎 Add 3 Luxury Features to Mini App"
            )

            LazyRow(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 6.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                items(suggestions) { prompt ->
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color(0xFF18202F))
                            .border(1.dp, Color(0x33F59E0B), RoundedCornerShape(16.dp))
                            .clickable { viewModel.sendGeminiPrompt(prompt) }
                            .padding(horizontal = 10.dp, vertical = 5.dp)
                    ) {
                        Text(
                            text = prompt,
                            fontSize = 10.5.sp,
                            fontWeight = FontWeight.Medium,
                            color = Color(0xFFF1F5F9)
                        )
                    }
                }
            }

            // ==================== CHAT HISTORY (SELECTABLE & COPIABLE) ====================
            SelectionContainer(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
            ) {
                LazyColumn(
                    state = listState,
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(geminiMessages.size) { index ->
                        val msg = geminiMessages[index]
                        GeminiModernMessageCard(
                            msg = msg,
                            isCopied = copiedMessageIndex == index,
                            goldAccent = geminiGoldAccent,
                            userBubbleBg = userBubbleColor,
                            aiCardBg = aiResponseCardBg,
                            onApplyCode = { code ->
                                viewModel.updateHtmlCode(code)
                                viewModel.setActiveTab(0)
                                Toast.makeText(context, "Code applied to Mini-App editor!", Toast.LENGTH_SHORT).show()
                            },
                            onCopyText = { text ->
                                clipboardManager.setText(AnnotatedString(text))
                                copiedMessageIndex = index
                                Toast.makeText(context, "Report copied to clipboard! ✓", Toast.LENGTH_SHORT).show()
                            },
                            onDownloadText = { text ->
                                val sendIntent = Intent().apply {
                                    action = Intent.ACTION_SEND
                                    putExtra(Intent.EXTRA_TEXT, text)
                                    type = "text/plain"
                                }
                                val shareIntent = Intent.createChooser(sendIntent, "Export Gemini Report")
                                shareIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                                context.startActivity(shareIntent)
                            },
                            onSpeakText = { text ->
                                ttsEngine?.stop()
                                ttsEngine?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "gemini_tts_$index")
                                Toast.makeText(context, "Speaking out loud from speaker 🔊", Toast.LENGTH_SHORT).show()
                            }
                        )
                    }

                    if (isThinking) {
                        item {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(Color(0xFF131D31), RoundedCornerShape(12.dp))
                                    .border(1.dp, Color(0x55F59E0B), RoundedCornerShape(12.dp))
                                    .padding(12.dp)
                            ) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(16.dp),
                                    color = geminiGoldAccent,
                                    strokeWidth = 2.dp
                                )
                                Spacer(modifier = Modifier.width(10.dp))
                                Text(
                                    text = "Gemini 3.7 is thinking & synthesizing response...",
                                    fontSize = 11.sp,
                                    color = geminiGoldLight,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(6.dp))

            // ==================== MODERN GEMINI FLOATING INPUT PILL CONSOLE ====================
            if (!isFloatingMode) {
                ModernGeminiInputDock(
                    inputText = inputText,
                    onTextChange = { inputText = it },
                    isThinking = isThinking,
                    selectedModel = selectedModel,
                    showModelMenu = showModelMenu,
                    onToggleModelMenu = { showModelMenu = it },
                    onSelectModel = { selectedModel = it },
                    showPlusMenu = showPlusMenu,
                    onTogglePlusMenu = { showPlusMenu = it },
                    onExpandToggle = { isExpandedInput = !isExpandedInput },
                    onPasteFromClipboard = {
                        val clip = clipboardManager.getText()?.text
                        if (!clip.isNullOrEmpty()) {
                            inputText = if (inputText.isBlank()) clip else "$inputText\n$clip"
                            Toast.makeText(context, "Pasted from clipboard!", Toast.LENGTH_SHORT).show()
                        }
                    },
                    onClearInput = { inputText = "" },
                    onSend = {
                        if (inputText.isNotBlank() && !isThinking) {
                            val text = inputText
                            inputText = ""
                            viewModel.sendGeminiPrompt(text)
                        }
                    }
                )
            }
        }

        // ==================== MOVABLE & SHIFTABLE FLOATING KEYBOARD / INPUT DIALOG ====================
        if (isFloatingMode) {
            Box(
                modifier = Modifier
                    .offset { IntOffset(floatingOffsetX.roundToInt(), floatingOffsetY.roundToInt()) }
                    .align(Alignment.BottomCenter)
                    .padding(bottom = 20.dp, start = 12.dp, end = 12.dp)
                    .pointerInput(Unit) {
                        detectDragGestures { change, dragAmount ->
                            change.consume()
                            floatingOffsetX += dragAmount.x
                            floatingOffsetY += dragAmount.y
                        }
                    }
            ) {
                Card(
                    modifier = Modifier.fillMaxWidth(0.95f),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF1B2232)),
                    shape = RoundedCornerShape(20.dp),
                    elevation = CardDefaults.cardElevation(defaultElevation = 12.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .border(1.5.dp, Color(0xFF388BFF), RoundedCornerShape(20.dp))
                            .padding(10.dp)
                    ) {
                        // Drag Handle & Title Bar
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.OpenWith, contentDescription = "Drag", tint = Color(0xFF388BFF), modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Movable Input Box (Drag anywhere)", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color.White)
                            }
                            IconButton(onClick = { isFloatingMode = false }, modifier = Modifier.size(24.dp)) {
                                Icon(Icons.Default.Close, contentDescription = "Close Floating", tint = Color.White, modifier = Modifier.size(16.dp))
                            }
                        }

                        Spacer(modifier = Modifier.height(6.dp))

                        ModernGeminiInputDock(
                            inputText = inputText,
                            onTextChange = { inputText = it },
                            isThinking = isThinking,
                            selectedModel = selectedModel,
                            showModelMenu = showModelMenu,
                            onToggleModelMenu = { showModelMenu = it },
                            onSelectModel = { selectedModel = it },
                            showPlusMenu = showPlusMenu,
                            onTogglePlusMenu = { showPlusMenu = it },
                            onExpandToggle = { isExpandedInput = !isExpandedInput },
                            onPasteFromClipboard = {
                                val clip = clipboardManager.getText()?.text
                                if (!clip.isNullOrEmpty()) {
                                    inputText = if (inputText.isBlank()) clip else "$inputText\n$clip"
                                }
                            },
                            onClearInput = { inputText = "" },
                            onSend = {
                                if (inputText.isNotBlank() && !isThinking) {
                                    val text = inputText
                                    inputText = ""
                                    viewModel.sendGeminiPrompt(text)
                                }
                            }
                        )
                    }
                }
            }
        }

        // ==================== EXPANDED FULL-SCREEN TYPING OVERLAY ====================
        if (isExpandedInput) {
            Dialog(
                onDismissRequest = { isExpandedInput = false },
                properties = DialogProperties(usePlatformDefaultWidth = false)
            ) {
                Surface(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color(0xFF0C0E14))
                        .padding(16.dp),
                    color = Color(0xFF0C0E14)
                ) {
                    Column(modifier = Modifier.fillMaxSize()) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Expanded Typing Studio", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = geminiGoldLight)
                            IconButton(onClick = { isExpandedInput = false }) {
                                Icon(Icons.Default.FullscreenExit, contentDescription = "Collapse", tint = Color.White)
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        OutlinedTextField(
                            value = inputText,
                            onValueChange = { inputText = it },
                            modifier = Modifier
                                .weight(1f)
                                .fillMaxWidth(),
                            placeholder = { Text("Type complete instructions, HTML code, or multi-line prompt...", color = Color(0xFF64748B)) },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.White,
                                focusedBorderColor = Color(0xFF388BFF),
                                unfocusedBorderColor = Color(0xFF333842),
                                focusedContainerColor = Color(0xFF131722),
                                unfocusedContainerColor = Color(0xFF131722)
                            ),
                            textStyle = TextStyle(fontSize = 14.sp, lineHeight = 20.sp)
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Button(
                                onClick = {
                                    val clip = clipboardManager.getText()?.text
                                    if (!clip.isNullOrEmpty()) {
                                        inputText = if (inputText.isBlank()) clip else "$inputText\n$clip"
                                    }
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E293B))
                            ) {
                                Icon(Icons.Default.ContentPaste, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Paste", color = Color.White)
                            }

                            Button(
                                onClick = {
                                    if (inputText.isNotBlank() && !isThinking) {
                                        val text = inputText
                                        inputText = ""
                                        isExpandedInput = false
                                        viewModel.sendGeminiPrompt(text)
                                    }
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF388BFF)),
                                enabled = inputText.isNotBlank() && !isThinking
                            ) {
                                Icon(Icons.AutoMirrored.Filled.Send, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Send to Gemini", color = Color.White, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }
}

// ==================== MODERN GEMINI FLOATING INPUT PILL COMPONENT ====================
@Composable
fun ModernGeminiInputDock(
    inputText: String,
    onTextChange: (String) -> Unit,
    isThinking: Boolean,
    selectedModel: String,
    showModelMenu: Boolean,
    onToggleModelMenu: (Boolean) -> Unit,
    onSelectModel: (String) -> Unit,
    showPlusMenu: Boolean,
    onTogglePlusMenu: (Boolean) -> Unit,
    onExpandToggle: () -> Unit,
    onPasteFromClipboard: () -> Unit,
    onClearInput: () -> Unit,
    onSend: () -> Unit
) {
    val context = LocalContext.current
    val geminiPillBg = Color(0xFF1E1F20)
    val geminiPillBorder = Color(0xFF333842)
    val geminiBlueAccent = Color(0xFF388BFF)

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // THE MAIN PILL INPUT CONTAINER (MATCHING GEMINI.GOOGLE.COM)
        Box(
            modifier = Modifier
                .weight(1f)
                .clip(RoundedCornerShape(26.dp))
                .background(geminiPillBg)
                .border(1.2.dp, geminiPillBorder, RoundedCornerShape(26.dp))
                .padding(horizontal = 8.dp, vertical = 4.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // (+) PLUS ATTACHMENT / ACTIONS BUTTON (LEFT)
                Box {
                    IconButton(
                        onClick = { onTogglePlusMenu(true) },
                        modifier = Modifier.size(34.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Add,
                            contentDescription = "Plus Actions",
                            tint = Color(0xFFC4C7C5),
                            modifier = Modifier.size(20.dp)
                        )
                    }

                    DropdownMenu(
                        expanded = showPlusMenu,
                        onDismissRequest = { onTogglePlusMenu(false) },
                        modifier = Modifier.background(Color(0xFF20232B))
                    ) {
                        DropdownMenuItem(
                            text = { Text("📋 Paste from Clipboard", color = Color.White, fontSize = 12.sp) },
                            onClick = {
                                onTogglePlusMenu(false)
                                onPasteFromClipboard()
                            }
                        )
                        DropdownMenuItem(
                            text = { Text("⤢ Expand to Full-Screen Editor", color = Color.White, fontSize = 12.sp) },
                            onClick = {
                                onTogglePlusMenu(false)
                                onExpandToggle()
                            }
                        )
                        DropdownMenuItem(
                            text = { Text("🗑️ Clear Current Input", color = Color(0xFFF87171), fontSize = 12.sp) },
                            onClick = {
                                onTogglePlusMenu(false)
                                onClearInput()
                            }
                        )
                    }
                }

                // Security Shield / Gemini Icon
                Icon(
                    imageVector = Icons.Default.Security,
                    contentDescription = null,
                    tint = Color(0xFF9CA3AF),
                    modifier = Modifier
                        .size(16.dp)
                        .padding(start = 2.dp)
                )

                // TEXT INPUT FIELD (CLEARLY VISIBLE, SCROLLABLE, MULTI-LINE)
                TextField(
                    value = inputText,
                    onValueChange = onTextChange,
                    placeholder = {
                        Text(
                            text = "Ask Gemini...",
                            color = Color(0xFF8E918F),
                            fontSize = 13.sp
                        )
                    },
                    modifier = Modifier
                        .weight(1f)
                        .heightIn(min = 40.dp, max = 110.dp),
                    colors = TextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedContainerColor = Color.Transparent,
                        unfocusedContainerColor = Color.Transparent,
                        focusedIndicatorColor = Color.Transparent,
                        unfocusedIndicatorColor = Color.Transparent,
                        cursorColor = geminiBlueAccent
                    ),
                    textStyle = TextStyle(
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Medium,
                        lineHeight = 18.sp,
                        color = Color.White
                    ),
                    maxLines = 4,
                    keyboardOptions = KeyboardOptions(
                        capitalization = KeyboardCapitalization.Sentences,
                        imeAction = ImeAction.Send
                    ),
                    keyboardActions = KeyboardActions(
                        onSend = { onSend() }
                    )
                )

                // MODEL SELECTOR DROPDOWN (Flash ∨)
                Box {
                    Row(
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color(0xFF282A2C))
                            .clickable { onToggleModelMenu(true) }
                            .padding(horizontal = 7.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = selectedModel,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Color(0xFFE3E3E3)
                        )
                        Icon(
                            imageVector = Icons.Default.ArrowDropDown,
                            contentDescription = "Model",
                            tint = Color(0xFFC4C7C5),
                            modifier = Modifier.size(15.dp)
                        )
                    }

                    DropdownMenu(
                        expanded = showModelMenu,
                        onDismissRequest = { onToggleModelMenu(false) },
                        modifier = Modifier.background(Color(0xFF20232B))
                    ) {
                        DropdownMenuItem(
                            text = { Text("⚡ Gemini 3.7 Flash (Default)", color = Color.White, fontSize = 11.sp) },
                            onClick = {
                                onSelectModel("Flash")
                                onToggleModelMenu(false)
                            }
                        )
                        DropdownMenuItem(
                            text = { Text("🧠 Gemini 3.7 Pro / Thinking", color = Color.White, fontSize = 11.sp) },
                            onClick = {
                                onSelectModel("Pro")
                                onToggleModelMenu(false)
                            }
                        )
                        DropdownMenuItem(
                            text = { Text("👑 SREYMARA Executive Model", color = Color(0xFFF59E0B), fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                            onClick = {
                                onSelectModel("Executive")
                                onToggleModelMenu(false)
                            }
                        )
                    }
                }

                Spacer(modifier = Modifier.width(4.dp))

                // MICROPHONE ICON (VOICE INPUT)
                IconButton(
                    onClick = {
                        Toast.makeText(context, "Microphone: Listening for voice prompt...", Toast.LENGTH_SHORT).show()
                    },
                    modifier = Modifier.size(32.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Mic,
                        contentDescription = "Voice Input",
                        tint = Color(0xFFC4C7C5),
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.width(6.dp))

        // PRIMARY SEND ARROW BUTTON (PROMINENT BLUE CIRCLE BUTTON - DIRECTLY BESIDE PILL)
        IconButton(
            onClick = onSend,
            enabled = !isThinking && inputText.isNotBlank(),
            modifier = Modifier
                .size(42.dp)
                .clip(CircleShape)
                .background(
                    if (inputText.isNotBlank() && !isThinking) {
                        geminiBlueAccent
                    } else {
                        Color(0xFF282A2C)
                    }
                )
        ) {
            Icon(
                imageVector = Icons.AutoMirrored.Filled.Send,
                contentDescription = "Send Prompt",
                tint = if (inputText.isNotBlank() && !isThinking) Color.White else Color(0xFF6B7280),
                modifier = Modifier.size(18.dp)
            )
        }
    }
}

// ==================== MODERN GEMINI MESSAGE CARD ====================
@Composable
fun GeminiModernMessageCard(
    msg: GeminiChatMessage,
    isCopied: Boolean,
    goldAccent: Color,
    userBubbleBg: Color,
    aiCardBg: Color,
    onApplyCode: (String) -> Unit,
    onCopyText: (String) -> Unit,
    onDownloadText: (String) -> Unit,
    onSpeakText: (String) -> Unit
) {
    val isUser = msg.sender == "You"
    val alignment = if (isUser) Alignment.End else Alignment.Start

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 2.dp),
        horizontalAlignment = alignment
    ) {
        // Message Content Box
        Card(
            modifier = Modifier
                .fillMaxWidth(if (isUser) 0.85f else 1f)
                .padding(vertical = 2.dp),
            colors = CardDefaults.cardColors(
                containerColor = if (isUser) userBubbleBg else if (msg.isError) Color(0xFF3F1414) else aiCardBg
            ),
            shape = RoundedCornerShape(16.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
        ) {
            Column(
                modifier = Modifier
                    .border(
                        width = 1.dp,
                        color = if (isUser) Color(0xFF3B82F6) else if (msg.isError) Color(0xFFEF4444) else Color(0x33388BFF),
                        shape = RoundedCornerShape(16.dp)
                    )
                    .padding(12.dp)
            ) {
                // TOP ACTION HEADER STRIP (AS REQUESTED)
                DisableSelection {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        // Left Header Badge
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            if (!isUser) {
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(Color(0xFF1E293B))
                                        .border(1.dp, Color(0x44388BFF), RoundedCornerShape(6.dp))
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text(
                                        text = "Markdown • ✨ Gemini",
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color(0xFF38BDF8)
                                    )
                                }
                                Spacer(modifier = Modifier.width(6.dp))
                            }
                            Text(
                                text = if (isUser) "You" else "✨ ${msg.sender}",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isUser) Color(0xFF60A5FA) else if (msg.isError) Color(0xFFEF4444) else Color(0xFFFFF2A1)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = msg.timestamp,
                                fontSize = 8.5.sp,
                                color = Color(0xFF64748B)
                            )
                        }

                        // Right Action Buttons (COPY, DOWNLOAD, SPEAKER)
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(2.dp)) {
                            // Read Out Loud / Speaker Button
                            IconButton(
                                onClick = { onSpeakText(msg.text) },
                                modifier = Modifier.size(28.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.VolumeUp,
                                    contentDescription = "Read Aloud",
                                    tint = Color(0xFF94A3B8),
                                    modifier = Modifier.size(15.dp)
                                )
                            }

                            // Download / Export Button
                            IconButton(
                                onClick = { onDownloadText(msg.text) },
                                modifier = Modifier.size(28.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.FileDownload,
                                    contentDescription = "Export Report",
                                    tint = Color(0xFF94A3B8),
                                    modifier = Modifier.size(15.dp)
                                )
                            }

                            // Copy Button with Checkmark Feedback
                            IconButton(
                                onClick = { onCopyText(msg.text) },
                                modifier = Modifier
                                    .size(28.dp)
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(if (isCopied) Color(0xFF065F46) else Color(0xFF1E293B))
                            ) {
                                Icon(
                                    imageVector = if (isCopied) Icons.Default.Check else Icons.Default.ContentCopy,
                                    contentDescription = "Copy Message",
                                    tint = if (isCopied) Color(0xFF34D399) else Color(0xFFF1F5F9),
                                    modifier = Modifier.size(14.dp)
                                )
                            }
                        }
                    }
                }

                // FORMATTED MESSAGE TEXT WITH HIGH CONTRAST & FULL SELECTION
                val formattedText = remember(msg.text) { formatMarkdownText(msg.text) }
                Text(
                    text = formattedText,
                    fontSize = 13.sp,
                    color = Color(0xFFF8FAFC),
                    lineHeight = 19.sp
                )

                // Dedicated "Apply Code to Mini-App Editor" Action Button if HTML code is present
                val extractedCode = remember(msg.text) { extractHtmlFromText(msg.text) }
                if (!isUser && extractedCode.isNotBlank()) {
                    Spacer(modifier = Modifier.height(10.dp))
                    DisableSelection {
                        Button(
                            onClick = { onApplyCode(extractedCode) },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Color(0xFFF59E0B)
                            ),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(
                                imageVector = Icons.Default.Code,
                                contentDescription = null,
                                tint = Color.Black,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "<> Apply Code to Mini-App Editor",
                                color = Color.Black,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.ExtraBold
                            )
                        }
                    }
                }
            }
        }
    }
}

// Parses **bold** and backticks in markdown for clean display
private fun formatMarkdownText(text: String): AnnotatedString {
    return buildAnnotatedString {
        val parts = text.split("**")
        var isBold = false
        for (part in parts) {
            if (isBold) {
                withStyle(SpanStyle(fontWeight = FontWeight.Bold, color = Color(0xFFFFF2A1))) {
                    append(part)
                }
            } else {
                append(part)
            }
            isBold = !isBold
        }
    }
}

private fun extractHtmlFromText(text: String): String {
    if (text.contains("```html")) {
        val start = text.indexOf("```html") + 7
        val end = text.indexOf("```", start)
        if (end > start) {
            return text.substring(start, end).trim()
        }
    }
    if (text.contains("<!DOCTYPE html>")) {
        val start = text.indexOf("<!DOCTYPE html>")
        val end = text.lastIndexOf("</html>")
        if (end > start) {
            return text.substring(start, end + 7).trim()
        }
    }
    return ""
}
