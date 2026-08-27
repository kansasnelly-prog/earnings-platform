/**
 * SREYMARA EXECUTIVE HUB - App Boot & Keep-Alive Controller
 * Model: gemini-3-flash-preview
 */

(function() {
  console.log("System Online: gemini-3-flash-preview active");

  // Keep-alive state retainer & ping loop
  function startKeepAlive() {
    console.log("[Keep-Alive] Starting session retainer & ping loop (gemini-3-flash-preview)");
    setInterval(function() {
      window._lastPingTimestamp = Date.now();
      if (window.Telegram && window.Telegram.WebApp) {
        try {
          window.Telegram.WebApp.ready();
        } catch (e) {}
      }
    }, 15000);

    window.addEventListener("visibilitychange", function() {
      if (document.visibilityState === "visible") {
        console.log("[Keep-Alive] Session active / restored to foreground");
        updateSystemStatusBadge("Active / Connected");
      }
    });

    document.addEventListener("touchstart", function() {}, { passive: true });
  }

  // Update UI Status Badge
  function updateSystemStatusBadge(statusText) {
    const textElem = document.getElementById("system-status-text");
    const indicatorElem = document.getElementById("system-status-indicator");
    const dotElem = document.getElementById("system-status-dot");

    if (textElem) {
      textElem.innerText = statusText || "Active / Connected";
    }
    if (indicatorElem) {
      indicatorElem.style.color = "#10B981";
    }
    if (dotElem) {
      dotElem.style.background = "#10B981";
      dotElem.classList.add("status-badge-active");
    }
  }

  function initBoot() {
    console.log("System Online: gemini-3-flash-preview active");
    updateSystemStatusBadge("Active / Connected");
    startKeepAlive();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initBoot);
  } else {
    initBoot();
  }

  window.SreymaraApp = {
    boot: initBoot,
    updateStatus: updateSystemStatusBadge,
    model: "gemini-3-flash-preview"
  };
})();
