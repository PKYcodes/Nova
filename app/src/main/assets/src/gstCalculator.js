// ---------- GST & Tax Calculator (India GST Slabs) ----------
import { makeDrawerControls } from "./drawers.js";
import { formatNumber } from "./core/format.js";
import { state } from "./state.js";
import { showToast } from "./toast.js";
import { vibrate } from "./audio.js";

const gstDrawer = document.getElementById("gstDrawer");
const gstBackdrop = document.getElementById("gstBackdrop");
const gstHandle = document.getElementById("gstHandle");
const gstCloseBtn = document.getElementById("gstCloseBtn");

const gstAmountInput = document.getElementById("gstAmountInput");
const gstRateBtns = document.querySelectorAll(".gst-rate-btn");
const gstCustomRate = document.getElementById("gstCustomRate");
const gstTypeInclusive = document.getElementById("gstTypeInclusive");
const gstTypeExclusive = document.getElementById("gstTypeExclusive");
const gstLoadCalcBtn = document.getElementById("gstLoadCalcBtn");

const gstNetDisplay = document.getElementById("gstNetDisplay");
const gstTaxDisplay = document.getElementById("gstTaxDisplay");
const gstCgstDisplay = document.getElementById("gstCgstDisplay");
const gstSgstDisplay = document.getElementById("gstSgstDisplay");
const gstTotalDisplay = document.getElementById("gstTotalDisplay");

const drawerControls = makeDrawerControls(gstDrawer, gstBackdrop, gstHandle);

let currentRate = 18;
let isInclusive = false; // default: Add GST (exclusive)

function calculateGST() {
  const rawAmt = parseFloat(gstAmountInput.value) || 0;
  let rate = currentRate;
  if (currentRate === -1) {
    rate = parseFloat(gstCustomRate.value) || 0;
  }

  let net = 0;
  let tax = 0;
  let total = 0;

  if (isInclusive) {
    // Amount already has GST included: Net = Amount / (1 + Rate/100)
    net = rawAmt / (1 + rate / 100);
    tax = rawAmt - net;
    total = rawAmt;
  } else {
    // Add GST to base amount: Tax = Amount * (Rate/100)
    net = rawAmt;
    tax = rawAmt * (rate / 100);
    total = net + tax;
  }

  const halfTax = tax / 2;

  gstNetDisplay.textContent = "₹ " + formatNumber(net.toFixed(2), "indian");
  gstTaxDisplay.textContent = "₹ " + formatNumber(tax.toFixed(2), "indian");
  gstCgstDisplay.textContent = "₹ " + formatNumber(halfTax.toFixed(2), "indian");
  gstSgstDisplay.textContent = "₹ " + formatNumber(halfTax.toFixed(2), "indian");
  gstTotalDisplay.textContent = "₹ " + formatNumber(total.toFixed(2), "indian");
}

gstRateBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    gstRateBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const r = parseFloat(btn.dataset.rate);
    currentRate = r;
    if (r === -1) {
      gstCustomRate.hidden = false;
      gstCustomRate.focus();
    } else {
      gstCustomRate.hidden = true;
    }
    calculateGST();
    vibrate(6);
  });
});

if (gstTypeExclusive && gstTypeInclusive) {
  gstTypeExclusive.addEventListener("click", () => {
    isInclusive = false;
    gstTypeExclusive.classList.add("active");
    gstTypeInclusive.classList.remove("active");
    calculateGST();
    vibrate(6);
  });
  gstTypeInclusive.addEventListener("click", () => {
    isInclusive = true;
    gstTypeInclusive.classList.add("active");
    gstTypeExclusive.classList.remove("active");
    calculateGST();
    vibrate(6);
  });
}

if (gstAmountInput) gstAmountInput.addEventListener("input", calculateGST);
if (gstCustomRate) gstCustomRate.addEventListener("input", calculateGST);

if (gstLoadCalcBtn) {
  gstLoadCalcBtn.addEventListener("click", () => {
    if (state.current && state.current !== "Error" && state.current !== "0") {
      gstAmountInput.value = state.current.replace(/,/g, "");
      calculateGST();
      showToast("Calculator number loaded: " + state.current);
      vibrate(8);
    } else {
      showToast("Pehle calculator mein koi number calculate karo");
    }
  });
}

if (gstCloseBtn) gstCloseBtn.addEventListener("click", drawerControls.close);

export function openGSTCalc() {
  if (state.current && state.current !== "Error" && state.current !== "0" && !gstAmountInput.value) {
    gstAmountInput.value = state.current.replace(/,/g, "");
  }
  calculateGST();
  drawerControls.open();
}
