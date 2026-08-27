package com.example.bridge

import com.example.model.TelegramThemeParams
import com.example.model.TelegramUser
import org.json.JSONObject

object TelegramWebAppJS {

    fun generateInjectionScript(
        user: TelegramUser,
        themeParams: TelegramThemeParams,
        colorScheme: String = "dark"
    ): String {
        val userJson = JSONObject().apply {
            put("id", user.id)
            put("first_name", user.firstName)
            put("last_name", user.lastName)
            put("username", user.username)
            put("language_code", user.languageCode)
            put("is_premium", user.isPremium)
            put("allows_write_to_pm", true)
        }

        val themeJson = JSONObject().apply {
            put("bg_color", themeParams.bgColor)
            put("text_color", themeParams.textColor)
            put("hint_color", themeParams.hintColor)
            put("link_color", themeParams.linkColor)
            put("button_color", themeParams.buttonColor)
            put("button_text_color", themeParams.buttonTextColor)
            put("secondary_bg_color", themeParams.secondaryBgColor)
            put("header_bg_color", themeParams.headerBgColor)
        }

        val initDataUnsafe = JSONObject().apply {
            put("query_id", "AAHgx10BAAAAAMDHXQE18m-d")
            put("user", userJson)
            put("auth_date", System.currentTimeMillis() / 1000)
            put("hash", "e16c802b1156637e61e0f31c34a17937402f1a3a")
        }

        val initDataStr = "query_id=AAHgx10BAAAAAMDHXQE18m-d&user=" + userJson.toString() + "&auth_date=" + (System.currentTimeMillis() / 1000) + "&hash=e16c802b1156637e61e0f31c34a17937402f1a3a"

        return """
            (function() {
                if (window.Telegram && window.Telegram.WebApp) {
                    console.log("[TelegramBridge] Telegram.WebApp already initialized.");
                    return;
                }

                // Intercept console.log, console.warn, console.error
                const origLog = console.log;
                const origWarn = console.warn;
                const origError = console.error;

                console.log = function() {
                    origLog.apply(console, arguments);
                    if (window.AndroidBridge) {
                        window.AndroidBridge.logConsole("INFO", Array.from(arguments).map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(" "));
                    }
                };
                console.warn = function() {
                    origWarn.apply(console, arguments);
                    if (window.AndroidBridge) {
                        window.AndroidBridge.logConsole("WARN", Array.from(arguments).map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(" "));
                    }
                };
                console.error = function() {
                    origError.apply(console, arguments);
                    if (window.AndroidBridge) {
                        window.AndroidBridge.logConsole("ERROR", Array.from(arguments).map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(" "));
                    }
                };

                const mainButtonListeners = [];
                const backButtonListeners = [];
                const eventListeners = {};

                const MainButton = {
                    text: 'CONTINUE',
                    color: '${themeParams.buttonColor}',
                    textColor: '${themeParams.buttonTextColor}',
                    isVisible: false,
                    isActive: true,
                    isProgressVisible: false,
                    setText: function(text) {
                        this.text = text;
                        this._update();
                        return this;
                    },
                    onClick: function(callback) {
                        if (typeof callback === 'function' && !mainButtonListeners.includes(callback)) {
                            mainButtonListeners.push(callback);
                        }
                        return this;
                    },
                    offClick: function(callback) {
                        const idx = mainButtonListeners.indexOf(callback);
                        if (idx > -1) mainButtonListeners.splice(idx, 1);
                        return this;
                    },
                    show: function() {
                        this.isVisible = true;
                        this._update();
                        return this;
                    },
                    hide: function() {
                        this.isVisible = false;
                        this._update();
                        return this;
                    },
                    enable: function() {
                        this.isActive = true;
                        this._update();
                        return this;
                    },
                    disable: function() {
                        this.isActive = false;
                        this._update();
                        return this;
                    },
                    showProgress: function(leaveActive) {
                        this.isProgressVisible = true;
                        if (!leaveActive) this.isActive = false;
                        this._update();
                        return this;
                    },
                    hideProgress: function() {
                        this.isProgressVisible = false;
                        this.isActive = true;
                        this._update();
                        return this;
                    },
                    setParams: function(params) {
                        if (params.text !== undefined) this.text = params.text;
                        if (params.color !== undefined) this.color = params.color;
                        if (params.text_color !== undefined) this.textColor = params.text_color;
                        if (params.is_active !== undefined) this.isActive = params.is_active;
                        if (params.is_visible !== undefined) this.isVisible = params.is_visible;
                        this._update();
                        return this;
                    },
                    _update: function() {
                        if (window.AndroidBridge) {
                            window.AndroidBridge.updateMainButton(JSON.stringify({
                                isVisible: this.isVisible,
                                text: this.text,
                                color: this.color,
                                textColor: this.textColor,
                                isActive: this.isActive,
                                isProgressVisible: this.isProgressVisible
                            }));
                        }
                    },
                    _triggerClick: function() {
                        mainButtonListeners.forEach(cb => {
                            try { cb(); } catch(e) { console.error("Error in MainButton listener:", e); }
                        });
                    }
                };

                const BackButton = {
                    isVisible: false,
                    show: function() {
                        this.isVisible = true;
                        if (window.AndroidBridge) window.AndroidBridge.updateBackButton(true);
                        return this;
                    },
                    hide: function() {
                        this.isVisible = false;
                        if (window.AndroidBridge) window.AndroidBridge.updateBackButton(false);
                        return this;
                    },
                    onClick: function(callback) {
                        if (typeof callback === 'function' && !backButtonListeners.includes(callback)) {
                            backButtonListeners.push(callback);
                        }
                        return this;
                    },
                    offClick: function(callback) {
                        const idx = backButtonListeners.indexOf(callback);
                        if (idx > -1) backButtonListeners.splice(idx, 1);
                        return this;
                    },
                    _triggerClick: function() {
                        backButtonListeners.forEach(cb => {
                            try { cb(); } catch(e) { console.error("Error in BackButton listener:", e); }
                        });
                    }
                };

                const HapticFeedback = {
                    impactOccurred: function(style) {
                        if (window.AndroidBridge) window.AndroidBridge.triggerHaptic("impact", style || "medium");
                        return this;
                    },
                    notificationOccurred: function(type) {
                        if (window.AndroidBridge) window.AndroidBridge.triggerHaptic("notification", type || "success");
                        return this;
                    },
                    selectionChanged: function() {
                        if (window.AndroidBridge) window.AndroidBridge.triggerHaptic("selection", "light");
                        return this;
                    }
                };

                const WebApp = {
                    initData: "${initDataStr}",
                    initDataUnsafe: ${initDataUnsafe.toString()},
                    version: "7.0",
                    isVersionAtLeast: function(ver) {
                        return parseFloat(ver || "0") <= 7.0;
                    },
                    platform: "android",
                    colorScheme: "${colorScheme}",
                    themeParams: ${themeJson.toString()},
                    isExpanded: true,
                    viewportHeight: window.innerHeight,
                    viewportStableHeight: window.innerHeight,
                    headerColor: "${themeParams.headerBgColor}",
                    backgroundColor: "${themeParams.bgColor}",
                    MainButton: MainButton,
                    BackButton: BackButton,
                    HapticFeedback: HapticFeedback,
                    ready: function() {
                        console.log("[Telegram.WebApp] ready() called");
                    },
                    expand: function() {
                        console.log("[Telegram.WebApp] expand() called");
                    },
                    close: function() {
                        if (window.AndroidBridge) window.AndroidBridge.close();
                    },
                    sendData: function(data) {
                        if (window.AndroidBridge) window.AndroidBridge.sendData(typeof data === 'object' ? JSON.stringify(data) : String(data));
                    },
                    showAlert: function(message, callback) {
                        if (window.AndroidBridge) window.AndroidBridge.showAlert(message);
                        if (typeof callback === 'function') callback();
                    },
                    showConfirm: function(message, callback) {
                        const res = confirm(message);
                        if (typeof callback === 'function') callback(res);
                    },
                    showPopup: function(params, callback) {
                        const msg = (params.title ? params.title + "\n\n" : "") + (params.message || "");
                        alert(msg);
                        if (typeof callback === 'function') callback("ok");
                    },
                    openLink: function(url) {
                        window.open(url, '_blank');
                    },
                    openTelegramLink: function(url) {
                        if (window.AndroidBridge) window.AndroidBridge.showToast("Opening Telegram link: " + url);
                    },
                    onEvent: function(eventType, eventHandler) {
                        if (!eventListeners[eventType]) eventListeners[eventType] = [];
                        eventListeners[eventType].push(eventHandler);
                    },
                    offEvent: function(eventType, eventHandler) {
                        if (eventListeners[eventType]) {
                            const idx = eventListeners[eventType].indexOf(eventHandler);
                            if (idx > -1) eventListeners[eventType].splice(idx, 1);
                        }
                    },
                    _triggerEvent: function(eventType, eventData) {
                        if (eventListeners[eventType]) {
                            eventListeners[eventType].forEach(cb => cb(eventData));
                        }
                    }
                };

                window.Telegram = window.Telegram || {};
                window.Telegram.WebApp = WebApp;

                // Dispatch event for TelegramWebviewProxy or script hooks
                window.dispatchEvent(new Event('telegramWebAppReady'));
                console.log("[TelegramBridge] Telegram.WebApp v7.0 successfully mounted!");
            })();
        """.trimIndent()
    }
}
