// ---------- Paste a number into the calculator from clipboard ----------
import { pasteMenuItem, pasteBadge } from "./dom.js";
import { state } from "./state.js";
import { render } from "./render.js";
import { showToast } from "./toast.js";
import { closeMenu } from "./menu.js";
import { voiceLang, speakNumber } from "./speech.js";
import { vibrate } from "./audio.js";

async function pasteFromClipboard() {
  let rawText = "";

  // 1. Check native Android bridge first (no permission popup)
  if (window.AndroidBridge && typeof window.AndroidBridge.readClipboard === "function") {
    try {
      rawText = window.AndroidBridge.readClipboard() || "";
    } catch (e) {}
  }

  // 2. Fallback to web navigator.clipboard
  if (!rawText && navigator.clipboard && navigator.clipboard.readText) {
    try {
      rawText = await navigator.clipboard.readText();
    } catch (e) {}
  }

  // Try pasting the number
  if (rawText && state.pasteNumber(rawText)) {
    render();
    vibrate(8);
    showToast("Number paste ho gaya");
    return;
  }

  // Clipboard has no number: Toast + Aloud Speech + Vibration
  const toastMsg = "Clipboard mein koi number nahi hai";
  showToast(toastMsg, 2400);
  vibrate([15, 40, 15]);

  const spokenMsg = voiceLang === "hi"
    ? "क्लिपबोर्ड में कोई नंबर नहीं है"
    : "No number found in clipboard";
  speakNumber(spokenMsg, true);
}

if (pasteMenuItem) {
  pasteMenuItem.addEventListener("click", () => {
    closeMenu();
    pasteFromClipboard();
  });
}

if (pasteBadge) {
  pasteBadge.addEventListener("click", (e) => {
    e.stopPropagation();
    pasteFromClipboard();
  });
}

window.addEventListener("paste", (e) => {
  const tag = document.activeElement && document.activeElement.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return;
  const text = e.clipboardData?.getData("text");
  if (text && state.pasteNumber(text)) {
    e.preventDefault();
    render();
    showToast("Pasted");
  }
});
