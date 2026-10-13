// ---------- Loan & EMI Calculator ----------
import { makeDrawerControls } from "./drawers.js";
import { formatNumber } from "./core/format.js";
import { state } from "./state.js";
import { showToast } from "./toast.js";
import { vibrate } from "./audio.js";

const emiDrawer = document.getElementById("emiDrawer");
const emiBackdrop = document.getElementById("emiBackdrop");
const emiHandle = document.getElementById("emiHandle");
const emiCloseBtn = document.getElementById("emiCloseBtn");

const emiAmountInput = document.getElementById("emiAmountInput");
const emiRateInput = document.getElementById("emiRateInput");
const emiTenureInput = document.getElementById("emiTenureInput");
const emiTenureYearBtn = document.getElementById("emiTenureYearBtn");
const emiTenureMonthBtn = document.getElementById("emiTenureMonthBtn");
const emiLoadCalcBtn = document.getElementById("emiLoadCalcBtn");

const emiMonthlyDisplay = document.getElementById("emiMonthlyDisplay");
const emiTotalInterestDisplay = document.getElementById("emiTotalInterestDisplay");
const emiTotalAmountDisplay = document.getElementById("emiTotalAmountDisplay");
const emiBarPrincipal = document.getElementById("emiBarPrincipal");
const emiBarInterest = document.getElementById("emiBarInterest");

const drawerControls = makeDrawerControls(emiDrawer, emiBackdrop, emiHandle);

let isTenureYears = true;

function calculateEMI() {
  const P = parseFloat(emiAmountInput.value) || 0;
  const annualRate = parseFloat(emiRateInput.value) || 0;
  const rawTenure = parseFloat(emiTenureInput.value) || 0;
  const N = isTenureYears ? rawTenure * 12 : rawTenure;

  if (P <= 0 || annualRate <= 0 || N <= 0) {
    emiMonthlyDisplay.textContent = "₹ 0";
    emiTotalInterestDisplay.textContent = "₹ 0";
    emiTotalAmountDisplay.textContent = "₹ 0";
    if (emiBarPrincipal) emiBarPrincipal.style.width = "50%";
    if (emiBarInterest) emiBarInterest.style.width = "50%";
    return;
  }

  // Monthly interest rate = Annual / (12 * 100)
  const r = annualRate / (12 * 100);
  // EMI = [P * r * (1 + r)^N] / [(1 + r)^N - 1]
  const emi = (P * r * Math.pow(1 + r, N)) / (Math.pow(1 + r, N) - 1);
  const totalPayable = emi * N;
  const totalInterest = totalPayable - P;

  emiMonthlyDisplay.textContent = "₹ " + formatNumber(Math.round(emi).toString(), "indian");
  emiTotalInterestDisplay.textContent = "₹ " + formatNumber(Math.round(totalInterest).toString(), "indian");
  emiTotalAmountDisplay.textContent = "₹ " + formatNumber(Math.round(totalPayable).toString(), "indian");

  if (emiBarPrincipal && emiBarInterest) {
    const pPct = Math.max(10, Math.min(90, (P / totalPayable) * 100));
    emiBarPrincipal.style.width = `${pPct}%`;
    emiBarInterest.style.width = `${100 - pPct}%`;
  }
}

if (emiTenureYearBtn && emiTenureMonthBtn) {
  emiTenureYearBtn.addEventListener("click", () => {
    isTenureYears = true;
    emiTenureYearBtn.classList.add("active");
    emiTenureMonthBtn.classList.remove("active");
    calculateEMI();
    vibrate(6);
  });
  emiTenureMonthBtn.addEventListener("click", () => {
    isTenureYears = false;
    emiTenureMonthBtn.classList.add("active");
    emiTenureYearBtn.classList.remove("active");
    calculateEMI();
    vibrate(6);
  });
}

[emiAmountInput, emiRateInput, emiTenureInput].forEach((inp) => {
  if (inp) inp.addEventListener("input", calculateEMI);
});

if (emiLoadCalcBtn) {
  emiLoadCalcBtn.addEventListener("click", () => {
    if (state.current && state.current !== "Error" && state.current !== "0") {
      emiAmountInput.value = state.current.replace(/,/g, "");
      calculateEMI();
      showToast("Loan amount loaded: " + state.current);
      vibrate(8);
    } else {
      showToast("Pehle calculator mein koi number calculate karo");
    }
  });
}

if (emiCloseBtn) emiCloseBtn.addEventListener("click", drawerControls.close);

export function openEMICalc() {
  calculateEMI();
  drawerControls.open();
}
