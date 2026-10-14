// ---------- Discount & Margin Calculator ----------
import { makeDrawerControls } from "./drawers.js";
import { formatNumber } from "./core/format.js";
import { numberToWordsFull } from "./core/numberWords.js";
import { voiceLang, speakNumber } from "./speech.js";
import { state } from "./state.js";
import { render } from "./render.js";
import { showToast } from "./toast.js";
import { vibrate } from "./audio.js";

const discDrawer = document.getElementById("discDrawer");
const discBackdrop = document.getElementById("discBackdrop");
const discHandle = document.getElementById("discHandle");
const discCloseBtn = document.getElementById("discCloseBtn");

const discPriceInput = document.getElementById("discPriceInput");
const discPercentInput = document.getElementById("discPercentInput");
const discExtraInput = document.getElementById("discExtraInput");
const discLoadCalcBtn = document.getElementById("discLoadCalcBtn");
const discSpeakBtn = document.getElementById("discSpeakBtn");
const discUseFinalBtn = document.getElementById("discUseFinalBtn");
const discPresetBtns = document.querySelectorAll(".disc-preset-btn");

const discFinalDisplay = document.getElementById("discFinalDisplay");
const discSavedDisplay = document.getElementById("discSavedDisplay");
const discEffDisplay = document.getElementById("discEffDisplay");

const drawerControls = makeDrawerControls(discDrawer, discBackdrop, discHandle);
let lastFinalPrice = 0;

function calculateDiscount() {
  const mrp = parseFloat(discPriceInput?.value || "0") || 0;
  const d1 = Math.min(100, Math.max(0, parseFloat(discPercentInput?.value || "0") || 0));
  const d2 = Math.min(100, Math.max(0, parseFloat(discExtraInput?.value || "0") || 0));

  const afterD1 = mrp * (1 - d1 / 100);
  const finalPrice = afterD1 * (1 - d2 / 100);
  const saved = mrp - finalPrice;
  const effPct = mrp > 0 ? (saved / mrp) * 100 : 0;
  lastFinalPrice = Math.round(finalPrice * 100) / 100;

  if (discFinalDisplay) discFinalDisplay.textContent = "₹ " + formatNumber(lastFinalPrice.toFixed(2), "indian");
  if (discSavedDisplay) discSavedDisplay.textContent = "₹ " + formatNumber(saved.toFixed(2), "indian");
  if (discEffDisplay) discEffDisplay.textContent = effPct.toFixed(1) + "% OFF";
}

discPresetBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    discPresetBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    if (discPercentInput) discPercentInput.value = btn.dataset.disc;
    calculateDiscount();
    vibrate(6);
  });
});

[discPriceInput, discPercentInput, discExtraInput].forEach((inp) => {
  if (inp) inp.addEventListener("input", calculateDiscount);
});

if (discLoadCalcBtn) {
  discLoadCalcBtn.addEventListener("click", () => {
    if (state.current && state.current !== "Error" && state.current !== "0") {
      discPriceInput.value = state.current.replace(/,/g, "");
      calculateDiscount();
      showToast("MRP loaded: " + state.current);
      vibrate(8);
    } else {
      showToast("Pehle calculator mein koi number type karo");
    }
  });
}

if (discSpeakBtn) {
  discSpeakBtn.addEventListener("click", () => {
    const numStr = Math.round(lastFinalPrice).toString();
    const words = numberToWordsFull(numStr, voiceLang);
    const enWords = numberToWordsFull(numStr, "en");
    showToast(words, 2200);
    speakNumber(words, true, enWords);
    vibrate(8);
  });
}

if (discUseFinalBtn) {
  discUseFinalBtn.addEventListener("click", () => {
    state.current = String(lastFinalPrice);
    state.tokens = [];
    state.awaitingNewNumber = true;
    state.justEvaluated = false;
    render();
    drawerControls.close();
    showToast("Final price calculator mein load ho gaya");
    vibrate(8);
  });
}

if (discCloseBtn) discCloseBtn.addEventListener("click", drawerControls.close);

export function openDiscountCalc() {
  if (state.current && state.current !== "Error" && state.current !== "0" && (!discPriceInput.value || discPriceInput.value === "1000")) {
    discPriceInput.value = state.current.replace(/,/g, "");
  }
  calculateDiscount();
  drawerControls.open();
}
