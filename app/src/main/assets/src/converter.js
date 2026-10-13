// ---------- Unit converter ----------
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
const CURRENCY_LIST = ["USD", "EUR", "GBP", "INR", "JPY", "AUD", "CAD", "CNY", "SGD", "AED"];
let currencyRateCache = {}; // key: "FROM_TO" -> { rate, ts }
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

async function fetchCurrencyRate(from, to) {
  if (from === to) return 1;
  const key = `${from}_${to}`;
  const cached = currencyRateCache[key];
  if (cached && Date.now() - cached.ts < 3600000) return cached.rate;
  const res = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
  if (!res.ok) throw new Error("rate fetch failed");
  const data = await res.json();
  const rate = data.rates[to];
  currencyRateCache[key] = { rate, ts: Date.now() };
  return rate;
}

let convRunToken = 0;
async function runConversion() {
  const amount = parseFloat(convFromInput.value);
  if (isNaN(amount)) { convToOutput.value = ""; return; }

  if (convCategory === "currency") {
    const myToken = ++convRunToken;
    convToOutput.value = "…";
    try {
      const rate = await fetchCurrencyRate(convFromUnit.value, convToUnit.value);
      if (myToken !== convRunToken) return; // a newer request superseded this one
      convToOutput.value = parseFloat((amount * rate).toFixed(4)).toString();
    } catch (e) {
      if (myToken !== convRunToken) return;
      convToOutput.value = "";
      showToast("Rates load nahi ho paaye — internet check karo");
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
