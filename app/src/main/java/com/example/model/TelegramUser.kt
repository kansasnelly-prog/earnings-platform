package com.example.model

import androidx.compose.ui.graphics.Color

data class TelegramUser(
    val id: Long = 123456789L,
    val firstName: String = "Alex",
    val lastName: String = "Developer",
    val username: String = "alex_dev",
    val languageCode: String = "en",
    val isPremium: Boolean = true
)

data class TelegramThemeParams(
    val bgColor: String = "#17212B",
    val textColor: String = "#FFFFFF",
    val hintColor: String = "#708499",
    val linkColor: String = "#64B5F6",
    val buttonColor: String = "#2481CC",
    val buttonTextColor: String = "#FFFFFF",
    val secondaryBgColor: String = "#232E3C",
    val headerBgColor: String = "#17212B"
)

data class MainButtonState(
    val isVisible: Boolean = false,
    val text: String = "CONTINUE",
    val color: String = "#2481CC",
    val textColor: String = "#FFFFFF",
    val isActive: Boolean = true,
    val isProgressVisible: Boolean = false
)

data class ConsoleLogItem(
    val timestamp: String,
    val level: LogLevel,
    val message: String
)

enum class LogLevel {
    INFO, DEBUG, WARNING, ERROR, BRIDGE
}
