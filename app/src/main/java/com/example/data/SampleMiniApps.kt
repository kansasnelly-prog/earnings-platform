package com.example.data

import android.content.Context

data class MiniAppTemplate(
    val id: String,
    val title: String,
    val icon: String,
    val description: String,
    val htmlCode: String
)

object SampleMiniApps {
    const val FALLBACK_INDEX_HTML = "<!DOCTYPE html><html><body><h1>SREYMARA Executive Hub</h1></body></html>"

    fun getDefaultHtml(context: Context? = null): String {
        return try {
            if (context != null) {
                context.assets.open("index.html").bufferedReader().use { it.readText() }
            } else {
                val stream = SampleMiniApps::class.java.classLoader?.getResourceAsStream("assets/index.html")
                    ?: SampleMiniApps::class.java.getResourceAsStream("/assets/index.html")
                if (stream != null) {
                    stream.bufferedReader().use { it.readText() }
                } else {
                    FALLBACK_INDEX_HTML
                }
            }
        } catch (e: Exception) {
            FALLBACK_INDEX_HTML
        }
    }

    fun getTemplates(context: Context? = null): List<MiniAppTemplate> {
        val html = getDefaultHtml(context)
        return listOf(
            MiniAppTemplate(
                id = "google_ai_studio",
                title = "Google AI Studio",
                icon = "✨",
                description = "Google AI Studio AI Assistant & Prompt Engineering Workspace",
                htmlCode = html
            ),
            MiniAppTemplate(
                id = "sreymara_hub",
                title = "Sreymara Executive Hub",
                icon = "👑",
                description = "Sreymara Live Executive Discovery & Solana Yield Suite",
                htmlCode = html
            )
        )
    }

    val templates: List<MiniAppTemplate>
        get() = getTemplates(null)
}
