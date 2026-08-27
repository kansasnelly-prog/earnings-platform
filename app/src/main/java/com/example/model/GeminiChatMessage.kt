package com.example.model

data class GeminiChatMessage(
    val sender: String,
    val text: String,
    val timestamp: String,
    val isError: Boolean = false
)
