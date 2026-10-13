// ---------- Keypad wiring ----------
import { keypad, clearKey, resultLine } from "./dom.js";
import { state } from "./state.js";
import { render, updateMemoryBadge } from "./render.js";
import { ensureAudio, vibrateForKey, soundOn } from "./audio.js";
import { addRipple, spawnBubbles } from "./bubbles.js";
import { advanceCheck, dismissCheckOverlay } from "./checkOverlay.js";
import { historyDrawer, clearHistory } from "./history.js";
import { voiceLang, speakNumber } from "./speech.js";
import { numberToWordsFull } from "./core/numberWords.js";
import { showToast } from "./toast.js";

// action fires on pointerdown (not click) — this removes the browser's synthetic
// click delay entirely, so the digit appears the instant a finger touches the key
function handleKeyAction(btn) {
  // every key except CHECK itself should break out of an in-progress check
  // overlay — most importantly AC, which must always get you back to the
  // calculator no matter how many times it's pressed mid-sequence
  if (btn.dataset.action !== "check") dismissCheckOverlay();

  if (btn.dataset.digit !== undefined) { state.inputDigit(btn.dataset.digit); render(); return; }
  switch (btn.dataset.action) {
    case "clear": state.clearAll(); render(); break;
    case "backspace": state.backspace(); render(); break;
    case "percent": state.percent(); render(); break;
    case "sign": state.toggleSign(); render(); break;
    case "decimal": state.inputDecimal(); render(); break;
    case "op": state.setOperator(btn.dataset.op); render(); break;
    case "equals": state.equals(); render(); break;
    case "sqrt": state.applySqrt(); render(); break;
    case "square": state.applySquare(); render(); break;
    case "pi": state.insertPi(); render(); break;
    case "mc": state.memoryClear(); updateMemoryBadge(); break;
    case "mr": state.memoryRecall(); render(); break;
    case "mplus": state.memoryAdd(1); updateMemoryBadge(); break;
    case "mminus": state.memoryAdd(-1); updateMemoryBadge(); break;
    case "history": historyDrawer.open(); break;
    case "check": advanceCheck(); break;
  }
}

document.querySelectorAll(".key").forEach((btn) => {
  btn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    ensureAudio();
    btn.classList.add("pressed");
    handleKeyAction(btn); // update the display first — highest priority, lowest latency
    addRipple(e, btn);
    spawnBubbles(e, btn);
    vibrateForKey(btn);
  });
  ["pointerup", "pointerleave", "pointercancel"].forEach((ev) =>
    btn.addEventListener(ev, () => btn.classList.remove("pressed"))
  );
});

// Long-press AC clears the whole history too
let clearHoldTimer = null;
clearKey.addEventListener("pointerdown", () => {
  clearHoldTimer = setTimeout(() => {
    if (confirm("Poori history clear karein? Ye undo nahi ho sakta.")) clearHistory();
    if (navigator.vibrate) { try { navigator.vibrate([10, 30, 10]); } catch (e) {} }
  }, 650);
});
["pointerup", "pointerleave", "pointercancel"].forEach((ev) =>
  clearKey.addEventListener(ev, () => clearTimeout(clearHoldTimer))
);

// ---------- Keyboard support ----------
window.addEventListener("keydown", (e) => {
  if (e.key >= "0" && e.key <= "9") { state.inputDigit(e.key); render(); }
  else if (e.key === ".") { state.inputDecimal(); render(); }
  else if (e.key === "+") { state.setOperator("+"); render(); }
  else if (e.key === "-") { state.setOperator("−"); render(); }
  else if (e.key === "*") { state.setOperator("×"); render(); }
  else if (e.key === "/") { e.preventDefault(); state.setOperator("÷"); render(); }
  else if (e.key === "Enter" || e.key === "=") { state.equals(); render(); }
  else if (e.key === "Backspace") { state.backspace(); render(); }
  else if (e.key === "Escape") { state.clearAll(); render(); }
  else if (e.key === "%") { state.percent(); render(); }
});

// ---------- Result line: long-press to copy, double-tap to hear it spoken ----------
let copyHoldTimer = null;
let copyLongPressFired = false;
resultLine.addEventListener("pointerdown", () => {
  copyLongPressFired = false;
  copyHoldTimer = setTimeout(() => {
    copyLongPressFired = true;
    const val = resultLine.textContent;
    const rawVal = val.replace(/,/g, "");
    if (window.AndroidBridge && typeof window.AndroidBridge.copyToClipboard === "function") {
      try {
        window.AndroidBridge.copyToClipboard(rawVal);
        showToast("Copied " + val);
        vibrateForKey(resultLine);
        return;
      } catch (e) {}
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(rawVal).then(() => {
        showToast("Copied " + val);
        if (navigator.vibrate) { try { navigator.vibrate([8, 20, 8]); } catch (e) {} }
      }).catch(() => {});
    }
  }, 550);
});
["pointerup", "pointerleave", "pointercancel"].forEach((ev) =>
  resultLine.addEventListener(ev, () => clearTimeout(copyHoldTimer))
);

let lastResultTap = 0;
resultLine.addEventListener("pointerup", () => {
  const now = Date.now();
  if (now - lastResultTap < 350) {
    lastResultTap = 0;
    if (state.current !== "Error" && !copyLongPressFired) {
      const words = numberToWordsFull(state.current, voiceLang);
      showToast(words, Math.min(6000, 1500 + words.length * 35));
      speakNumber(words, soundOn);
      if (navigator.vibrate) { try { navigator.vibrate([10, 20, 10]); } catch (e) {} }
    }
  } else {
    lastResultTap = now;
  }
});
