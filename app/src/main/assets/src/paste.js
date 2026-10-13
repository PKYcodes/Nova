// ---------- Paste a number into the calculator from the clipboard ----------
import { pasteMenuItem, pasteBadge } from "./dom.js";
import { state } from "./state.js";
import { render } from "./render.js";
import { showToast } from "./toast.js";
import { closeMenu } from "./menu.js";

async function pasteFromClipboard() {
  if (window.AndroidBridge && typeof window.AndroidBridge.readClipboard === "function") {
    try {
      const nativeText = window.AndroidBridge.readClipboard() || "";
      if (state.pasteNumber(nativeText)) {
        render();
        if (window.AndroidBridge.vibrate) window.AndroidBridge.vibrate("8");
      } else {
        showToast("Clipboard mein koi valid number nahi mila");
      }
      return;
    } catch (e) {}
  }
  if (!navigator.clipboard || !navigator.clipboard.readText) {
    showToast("Is browser mein clipboard access allowed nahi hai");
    return;
  }
  try {
    const text = await navigator.clipboard.readText();
    if (state.pasteNumber(text)) {
      render();
      if (navigator.vibrate) { try { navigator.vibrate(8); } catch (e) {} }
    } else {
      showToast("Clipboard mein koi valid number nahi mila");
    }
  } catch (e) {
    showToast("Paste karne ki permission nahi mili");
  }
}

if (pasteMenuItem) {
  pasteMenuItem.addEventListener("click", () => {
    closeMenu();
    pasteFromClipboard();
  });
}

// on-screen shortcut right on the display, next to the entry-count badge —
// faster than digging into the ⋮ menu every time
if (pasteBadge) {
  pasteBadge.addEventListener("click", (e) => {
    e.stopPropagation();
    pasteFromClipboard();
  });
}

// Ctrl+V (or a native "Paste" tap from text selection on mobile) also feeds
// the calculator directly — but only when focus isn't inside a real text
// input, so the unit converter's own fields keep normal paste behavior.
window.addEventListener("paste", (e) => {
  const tag = document.activeElement && document.activeElement.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return;
  const text = e.clipboardData?.getData("text");
  if (text && state.pasteNumber(text)) {
    e.preventDefault();
    render();
  }
});
