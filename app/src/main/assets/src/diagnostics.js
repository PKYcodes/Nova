// ---------- Diagnostics: Crash reporting + Global Safety Guards ----------
if (typeof window !== "undefined" && typeof window.vibrate === "undefined") {
  window.vibrate = function(ms) {
    if (window.AndroidBridge && typeof window.AndroidBridge.vibrate === "function") {
      try {
        window.AndroidBridge.vibrate(Array.isArray(ms) ? ms.join(",") : String(ms));
        return;
      } catch (e) {}
    }
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try { navigator.vibrate(ms); } catch (e) {}
    }
  };
}

function showFatalError(msg) {
  let box = document.getElementById("fatalErrorBox");
  if (!box) {
    box = document.createElement("div");
    box.id = "fatalErrorBox";
    box.style.cssText =
      "position:fixed;left:8px;right:8px;top:8px;z-index:99999;background:#3a0000;" +
      "color:#ffb4b4;font:12px/1.4 monospace;padding:10px 12px;border-radius:8px;" +
      "border:1px solid #ff4d4d;white-space:pre-wrap;word-break:break-word;max-height:40vh;overflow:auto;";
    document.body.appendChild(box);
  }
  const line = document.createElement("div");
  line.textContent = "⚠ " + msg;
  box.appendChild(line);
}
window.addEventListener("error", (e) => {
  showFatalError((e && e.message) || "Unknown error");
});
window.addEventListener("unhandledrejection", (e) => {
  showFatalError("Promise error: " + ((e && e.reason && e.reason.message) || e.reason || "unknown"));
});
