// ---------- Unit Converter + Reliable Currency Converter ----------
import {
  convBackdrop, convDrawer, convHandle, convCloseBtn, convTabs,
  convFromInput, convToOutput, convFromUnit, convToUnit, convSwapBtn,
} from "./dom.js";
import { makeDrawerControls } from "./drawers.js";
import { showToast } from "./toast.js";

const drawerControls = makeDrawerControls(convDrawer, convBackdrop, convHandle);

const CONV_UNITS = {
  length: { units: { km: 1000, m: 1, cm: 0.01, mile: 1609.344, foot: 0.3048, inch: 0.0254 } },
  weight: { units: { kg: 1, g: 0.001, lb: 0.453592, oz: 0.0283495 } },
};

const CURRENCY_LIST = ["USD", "INR", "EUR", "GBP", "AED", "JPY", "CAD", "AUD", "CNY", "SGD", "SAR", "QAR", "KWD"];

// Realistic built-in offline exchange rates (relative to USD) - ensures converter NEVER fails
const OFFLINE_BASE_RATES = {
  USD: 1.0,
  INR: 84.15,
  EUR: 0.92,
  GBP: 0.77,
  AED: 3.67,
  JPY: 149.80,
  CAD: 1.38,
  AUD: 1.50,
  CNY: 7.12,
  SGD: 1.31,
  SAR: 3.75,
  QAR: 3.64,
  KWD: 0.31,
};

let currencyRatesCache = {};
const RATES_CACHE_KEY = "nova_currency_rates_v2";

try {
  const saved = localStorage.getItem(RATES_CACHE_KEY);
  if (saved) currencyRatesCache = JSON.parse(saved);
} catch (e) {}

let convCategory = "length";

function populateConvUnits() {
  if (convCategory === "temp") {
    const opts = ["C", "F", "K"];
    convFromUnit.innerHTML = opts.map((u) => `<option value="${u}">°${u}</option>`).join("");
    convToUnit.innerHTML = opts.map((u) => `<option value="${u}">°${u}</option>`).join("");
    convFromUnit.value = "C";
    convToUnit.value = "F";
  } else if (convCategory === "currency") {
    convFromUnit.innerHTML = CURRENCY_LIST.map((u) => `<option value="${u}">${u}</option>`).join("");
    convToUnit.innerHTML = CURRENCY_LIST.map((u) => `<option value="${u}">${u}</option>`).join("");
    convFromUnit.value = "USD";
    convToUnit.value = "INR";
  } else {
    const units = Object.keys(CONV_UNITS[convCategory].units);
    convFromUnit.innerHTML = units.map((u) => `<option value="${u}">${u}</option>`).join("");
    convToUnit.innerHTML = units.map((u) => `<option value="${u}">${u}</option>`).join("");
    convFromUnit.value = units[0];
    convToUnit.value = units[1];
  }
}

function toCelsius(v, u) { return u === "C" ? v : u === "F" ? (v - 32) * 5 / 9 : v - 273.15; }
function fromCelsius(c, u) { return u === "C" ? c : u === "F" ? c * 9 / 5 + 32 : c + 273.15; }

async function fetchLiveCurrencyRate(from, to) {
  if (from === to) return 1.0;
  const pairKey = `${from}_${to}`;
  const cached = currencyRatesCache[pairKey];
  // 6 hour cache window
  if (cached && Date.now() - cached.ts < 6 * 3600 * 1000) {
    return cached.rate;
  }

  // 1. Try Primary Open Exchange API (Supports all 160+ fiat currencies without API key)
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${from}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.rates && data.rates[to]) {
        const rate = data.rates[to];
        currencyRatesCache[pairKey] = { rate, ts: Date.now() };
        try { localStorage.setItem(RATES_CACHE_KEY, JSON.stringify(currencyRatesCache)); } catch (e) {}
        return rate;
      }
    }
  } catch (e) {}

  // 2. Try Secondary Fallback API
  try {
    const res2 = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`);
    if (res2.ok) {
      const data2 = await res2.json();
      if (data2 && data2.rates && data2.rates[to]) {
        const rate2 = data2.rates[to];
        currencyRatesCache[pairKey] = { rate: rate2, ts: Date.now() };
        return rate2;
      }
    }
  } catch (e) {}

  // 3. Guaranteed Offline Fallback Rates (Never fails)
  const fromBase = OFFLINE_BASE_RATES[from] || 1.0;
  const toBase = OFFLINE_BASE_RATES[to] || 1.0;
  return toBase / fromBase;
}

let convRunToken = 0;
async function runConversion() {
  const amount = parseFloat(convFromInput.value);
  if (isNaN(amount)) { convToOutput.value = ""; return; }

  if (convCategory === "currency") {
    const myToken = ++convRunToken;
    const from = convFromUnit.value;
    const to = convToUnit.value;

    // Instant calculation using offline rates / cache first so UI never blocks
    const fromBase = OFFLINE_BASE_RATES[from] || 1.0;
    const toBase = OFFLINE_BASE_RATES[to] || 1.0;
    const instantRate = (currencyRatesCache[`${from}_${to}`]?.rate) || (toBase / fromBase);
    convToOutput.value = parseFloat((amount * instantRate).toFixed(4)).toString();

    // Fetch live rate in background
    try {
      const liveRate = await fetchLiveCurrencyRate(from, to);
      if (myToken !== convRunToken) return;
      convToOutput.value = parseFloat((amount * liveRate).toFixed(4)).toString();
    } catch (e) {
      // Offline fallback already showing!
    }
    return;
  }

  let result;
  if (convCategory === "temp") {
    result = fromCelsius(toCelsius(amount, convFromUnit.value), convToUnit.value);
  } else {
    const units = CONV_UNITS[convCategory].units;
    const inBase = amount * units[convFromUnit.value];
    result = inBase / units[convToUnit.value];
  }
  convToOutput.value = Number.isFinite(result) ? parseFloat(result.toFixed(6)).toString() : "";
}

convTabs.querySelectorAll(".conv-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    convTabs.querySelectorAll(".conv-tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    convCategory = tab.dataset.cat;
    populateConvUnits();
    runConversion();
    if (navigator.vibrate) { try { navigator.vibrate(6); } catch (e) {} }
  });
});
convFromInput.addEventListener("input", runConversion);
convFromUnit.addEventListener("change", runConversion);
convToUnit.addEventListener("change", runConversion);
convSwapBtn.addEventListener("click", () => {
  const f = convFromUnit.value;
  convFromUnit.value = convToUnit.value;
  convToUnit.value = f;
  runConversion();
  if (navigator.vibrate) { try { navigator.vibrate(6); } catch (e) {} }
});
convCloseBtn.addEventListener("click", drawerControls.close);

export function openConverter() {
  populateConvUnits();
  runConversion();
  drawerControls.open();
}
