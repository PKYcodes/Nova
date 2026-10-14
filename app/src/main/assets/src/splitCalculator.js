// ---------- Bill Splitter & Tip Calculator ----------
import { makeDrawerControls } from "./drawers.js";
import { formatNumber } from "./core/format.js";
import { numberToWordsFull } from "./core/numberWords.js";
import { voiceLang, speakNumber } from "./speech.js";
import { state } from "./state.js";
import { showToast } from "./toast.js";
import { vibrate } from "./audio.js";

const splitDrawer = document.getElementById("splitDrawer");
const splitBackdrop = document.getElementById("splitBackdrop");
const splitHandle = document.getElementById("splitHandle");
const splitCloseBtn = document.getElementById("splitCloseBtn");

const splitBillInput = document.getElementById("splitBillInput");
const splitTipBtns = document.querySelectorAll(".split-tip-btn");
const splitPeopleMinus = document.getElementById("splitPeopleMinus");
const splitPeoplePlus = document.getElementById("splitPeoplePlus");
const splitPeopleCountEl = document.getElementById("splitPeopleCount");
const splitLoadCalcBtn = document.getElementById("splitLoadCalcBtn");
const splitShareBtn = document.getElementById("splitShareBtn");
const splitSpeakBtn = document.getElementById("splitSpeakBtn");

const splitPerPersonDisplay = document.getElementById("splitPerPersonDisplay");
const splitTipAmountDisplay = document.getElementById("splitTipAmountDisplay");
const splitTotalBillDisplay = document.getElementById("splitTotalBillDisplay");

const drawerControls = makeDrawerControls(splitDrawer, splitBackdrop, splitHandle);

let peopleCount = 4;
let tipPercent = 0;
let perPersonAmt = 0;

function calculateSplit() {
  const bill = parseFloat(splitBillInput?.value || "0") || 0;
  const tipAmt = bill * (tipPercent / 100);
  const totalBill = bill + tipAmt;
  perPersonAmt = peopleCount > 0 ? totalBill / peopleCount : totalBill;

  if (splitPeopleCountEl) splitPeopleCountEl.textContent = String(peopleCount);
  if (splitPerPersonDisplay) splitPerPersonDisplay.textContent = "₹ " + formatNumber(perPersonAmt.toFixed(2), "indian");
  if (splitTipAmountDisplay) splitTipAmountDisplay.textContent = "₹ " + formatNumber(tipAmt.toFixed(2), "indian");
  if (splitTotalBillDisplay) splitTotalBillDisplay.textContent = "₹ " + formatNumber(totalBill.toFixed(2), "indian");
}

splitTipBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    splitTipBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    tipPercent = parseFloat(btn.dataset.tip || "0") || 0;
    calculateSplit();
    vibrate(6);
  });
});

if (splitPeopleMinus) {
  splitPeopleMinus.addEventListener("click", () => {
    if (peopleCount > 1) {
      peopleCount--;
      calculateSplit();
      vibrate(6);
    }
  });
}
if (splitPeoplePlus) {
  splitPeoplePlus.addEventListener("click", () => {
    if (peopleCount < 99) {
      peopleCount++;
      calculateSplit();
      vibrate(6);
    }
  });
}

if (splitBillInput) splitBillInput.addEventListener("input", calculateSplit);

if (splitLoadCalcBtn) {
  splitLoadCalcBtn.addEventListener("click", () => {
    if (state.current && state.current !== "Error" && state.current !== "0") {
      splitBillInput.value = state.current.replace(/,/g, "");
      calculateSplit();
      showToast("Bill amount loaded: " + state.current);
      vibrate(8);
    } else {
      showToast("Pehle calculator mein koi number type karo");
    }
  });
}

if (splitSpeakBtn) {
  splitSpeakBtn.addEventListener("click", () => {
    const numStr = Math.round(perPersonAmt).toString();
    const words = numberToWordsFull(numStr, voiceLang);
    const enWords = numberToWordsFull(numStr, "en");
    showToast(words + " per person", 2200);
    speakNumber(words, true, enWords);
    vibrate(8);
  });
}

if (splitShareBtn) {
  splitShareBtn.addEventListener("click", () => {
    const bill = parseFloat(splitBillInput?.value || "0") || 0;
    const summary =
      `🧾 Bill Split Summary — Nova Calculator\n` +
      `Total Bill: ₹${bill.toLocaleString()}${tipPercent > 0 ? " (+" + tipPercent + "% Tip)" : ""}\n` +
      `People: ${peopleCount}\n` +
      `👉 Per Person Share: ₹${perPersonAmt.toFixed(2)}\n` +
      `RV Group LTD | ♥️ BY PANKAJ`;
    if (window.AndroidBridge && typeof window.AndroidBridge.shareWhatsApp === "function") {
      window.AndroidBridge.shareWhatsApp("", summary);
    } else {
      window.open("https://wa.me/?text=" + encodeURIComponent(summary), "_blank", "noopener");
    }
  });
}

if (splitCloseBtn) splitCloseBtn.addEventListener("click", drawerControls.close);

export function openSplitCalc() {
  if (state.current && state.current !== "Error" && state.current !== "0" && (!splitBillInput.value || splitBillInput.value === "1200")) {
    splitBillInput.value = state.current.replace(/,/g, "");
  }
  calculateSplit();
  drawerControls.open();
}
