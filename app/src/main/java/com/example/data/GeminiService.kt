package com.example.data

import com.example.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.net.SocketTimeoutException
import java.util.concurrent.TimeUnit

object GeminiService {
    private const val BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/"

    // Modern supported models in order of priority (Primary -> Failover Fallbacks)
    private val MODELS_TO_TRY = listOf(
        "gemini-3.5-flash",
        "gemini-3.1-pro-preview",
        "gemini-flash-latest",
        "gemini-3-flash-preview"
    )

    // Hardened client with 120-second timeout settings
    private val client = OkHttpClient.Builder()
        .connectTimeout(120, TimeUnit.SECONDS)
        .readTimeout(120, TimeUnit.SECONDS)
        .writeTimeout(120, TimeUnit.SECONDS)
        .callTimeout(120, TimeUnit.SECONDS)
        .build()

    suspend fun chatWithGemini(
        userPrompt: String,
        customApiKey: String = "",
        currentHtmlContext: String = "",
        consoleLogsContext: String = ""
    ): Result<String> = withContext(Dispatchers.IO) {
        val apiKey = customApiKey.trim().ifBlank { BuildConfig.GEMINI_API_KEY.trim() }

        if (apiKey.isBlank() || apiKey == "MY_GEMINI_API_KEY") {
            return@withContext Result.failure(
                IllegalStateException("Gemini API key is missing or invalid. Please configure your API key in the Gemini Settings panel.")
            )
        }

        val systemInstructionText = """
            You are the "GEMINI VIP EXECUTIVE CO-PILOT" for the SREYMARA Ecosystem. You possess full-stack software architecture capabilities, native mobile compilation expertise (React, Vite, Capacitor, Android Gradle), and Web3/Solana integration mastery.

            YOUR CORE CAPABILITIES & OPERATIONAL INSTRUCTIONS:
            1. CODE EDITING & GENERATION:
               - When asked to extend, rebuild, or fix the app, generate production-ready code blocks formatted clearly with file destinations specified (e.g., `src/components/TelegramMiniView.tsx` or `index.html`).
               - Format complete HTML/JS solutions inside ```html code blocks so the user can immediately tap "<> Apply Code to Mini-App Editor".
               - Ensure all React components strictly follow hook ordering rules (never call hooks conditionally or after early return guards) to prevent React #300 errors.

            2. STANDALONE APK BUILD INITIATION:
               - When the user asks to "build a standalone APK", generate the precise GitHub REST API trigger payload to invoke the `.github/workflows/android.yml` workflow via `workflow_dispatch`.
               - Target Repository: vinsovin7-cmd/sreymara1
               - Provide the curl/fetch payload:
                 POST https://api.github.com/repos/vinsovin7-cmd/sreymara1/actions/workflows/android.yml/dispatches
                 Headers:
                   Accept: application/vnd.github+json
                   Authorization: Bearer <YOUR_GITHUB_PAT>
                 Body:
                   {"ref": "main"}
               - Direct the user to download the generated `SreymaraStandaloneAPK` artifact once the workflow completes on GitHub Actions.

            3. CONTINUOUS SYSTEM EVOLUTION:
               - When requested to upgrade the app to a "new level", output the complete code delta and automatically provide the code block ready for "<> Apply Code to Mini-App Editor".
               - Maintain full ecosystem context: Solana SPL Safe Pot (${'$'}SREYMARA, ${'$'}NELLY), 20 Regional YouTube Cinema streams, Embedded Social Palace mini-apps, and SREYMARA API Key Engine.
        """.trimIndent()

        val jsonBody = JSONObject().apply {
            put("systemInstruction", JSONObject().apply {
                put("parts", JSONArray().put(JSONObject().put("text", systemInstructionText)))
            })

            val fullPrompt = StringBuilder().apply {
                append(userPrompt)
                if (currentHtmlContext.isNotBlank()) {
                    append("\n\n--- CURRENT LOADED MINI-APP HTML (TRUNCATED Context) ---\n")
                    append(currentHtmlContext.take(2000))
                }
                if (consoleLogsContext.isNotBlank()) {
                    append("\n\n--- RECENT LIVE CONSOLE LOGS ---\n")
                    append(consoleLogsContext.take(1000))
                }
            }.toString()

            val contentsArray = JSONArray().put(
                JSONObject().put("parts", JSONArray().put(
                    JSONObject().put("text", fullPrompt)
                ))
            )
            put("contents", contentsArray)
        }

        val mediaType = "application/json; charset=utf-8".toMediaType()
        val requestBody = jsonBody.toString().toRequestBody(mediaType)

        var lastError: Exception? = null

        // Seamless Model Fallback Loop
        for (model in MODELS_TO_TRY) {
            val maxRetries = 3
            var retryDelayMs = 2000L

            for (attempt in 1..maxRetries) {
                try {
                    val url = "$BASE_URL$model:generateContent?key=$apiKey"
                    val request = Request.Builder()
                        .url(url)
                        .post(requestBody)
                        .build()

                    val response = client.newCall(request).execute()
                    val responseCode = response.code
                    val responseString = response.body?.string() ?: ""

                    if (response.isSuccessful) {
                        val jsonResponse = JSONObject(responseString)
                        val candidates = jsonResponse.optJSONArray("candidates")
                        if (candidates != null && candidates.length() > 0) {
                            val firstCandidate = candidates.getJSONObject(0)
                            val contentObj = firstCandidate.optJSONObject("content")
                            val partsArray = contentObj?.optJSONArray("parts")
                            if (partsArray != null && partsArray.length() > 0) {
                                val replyText = partsArray.getJSONObject(0).optString("text", "No response generated.")
                                return@withContext Result.success(replyText)
                            }
                        }
                    }

                    // Handles HTTP 503 (Unavailable) or 429 (Rate Limit) with exponential backoff
                    if (responseCode == 503 || responseCode == 429) {
                        lastError = Exception("Model $model busy (HTTP $responseCode). Retrying attempt $attempt/$maxRetries...")
                        if (attempt < maxRetries) {
                            delay(retryDelayMs)
                            retryDelayMs *= 2 // 2s, 4s, 8s exponential backoff
                            continue
                        }
                    } else {
                        // Non-retryable HTTP error or model-specific error, failover to next model
                        lastError = Exception("Model $model error HTTP $responseCode: ${cleanErrorMessage(responseString)}")
                        break
                    }
                } catch (e: Exception) {
                    // SocketTimeoutException, IOException, or connection errors
                    lastError = e
                    if (attempt < maxRetries) {
                        delay(retryDelayMs)
                        retryDelayMs *= 2
                    }
                }
            }
        }

        val finalErrorMsg = lastError?.message ?: "High server demand across Gemini models. Please try again shortly."
        Result.failure(Exception(finalErrorMsg))
    }

    private fun cleanErrorMessage(rawJson: String): String {
        return try {
            val json = JSONObject(rawJson)
            val errorObj = json.optJSONObject("error")
            errorObj?.optString("message") ?: rawJson.take(200)
        } catch (_: Exception) {
            rawJson.take(200)
        }
    }
}


