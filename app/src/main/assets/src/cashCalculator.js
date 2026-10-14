// ---------- Cash Denomination Counter (Indian Currency) ----------
import { makeDrawerControls } from "./drawers.js";
import { formatNumber } from "./core/format.js";
import { numberToWordsFull } from "./core/numberWords.js";
import { voiceLang, speakNumber } from "./speech.js";
import { showToast } from "./toast.js";
import { vibrate } from "./audio.js";

const cashDrawer = document.getElementById("cashDrawer");
const cashBackdrop = document.getElementById("cashBackdrop");
const cashHandle = document.getElementById("cashHandle");
const cashCloseBtn = document.getElementById("cashCloseBtn");
const cashClearBtn = document.getElementById("cashClearBtn");
const cashShareBtn = document.getElementById("cashShareBtn");

const cashTotalAmountEl = document.getElementById("cashTotalAmount");
const cashTotalNotesEl = document.getElementById("cashTotalNotes");
const cashInWordsEl = document.getElementById("cashInWords");

const drawerControls = makeDrawerControls(cashDrawer, cashBackdrop, cashHandle);

const DENOMINATIONS = [500, 200, 100, 50, 20, 10, 5, 2, 1];

export function calculateCash() {
  let grandTotal = 0;
  let totalNotes = 0;

  DENOMINATIONS.forEach((denom) => {
    const input = document.getElementById(`noteCount_${denom}`);
    const subtotalEl = document.getElementById(`subtotal_${denom}`);
    const count = parseInt(input?.value || "0", 10) || 0;
    const sub = count * denom;
    grandTotal += sub;
    totalNotes += count;
    if (subtotalEl) {
      subtotalEl.textContent = sub > 0 ? "₹ " + formatNumber(sub.toString(), "indian") : "₹ 0";
    }
  });

  if (cashTotalAmountEl) cashTotalAmountEl.textContent = "₹ " + formatNumber(grandTotal.toString(), "indian");
  if (cashTotalNotesEl) cashTotalNotesEl.textContent = totalNotes.toLocaleString() + " notes";

  if (cashInWordsEl) {
    if (grandTotal > 0) {
      const words = numberToWordsFull(grandTotal.toString(), voiceLang);
      cashInWordsEl.textContent = words + (voiceLang === "hi" ? " रुपये मात्र" : " Rupees Only");
    } else {
      cashInWordsEl.textContent = "शून्य रुपये";
    }
  }

  return { grandTotal, totalNotes };
}

DENOMINATIONS.forEach((denom) => {
  const input = document.getElementById(`noteCount_${denom}`);
  if (input) {
    input.addEventListener("input", () => {
      calculateCash();
    });
  }
});

if (cashClearBtn) {
  cashClearBtn.addEventListener("click", () => {
    DENOMINATIONS.forEach((denom) => {
      const input = document.getElementById(`noteCount_${denom}`);
      if (input) input.value = "";
    });
    calculateCash();
    showToast("Cash tally cleared");
    vibrate(8);
  });
}

if (cashShareBtn) {
  cashShareBtn.addEventListener("click", () => {
    const { grandTotal, totalNotes } = calculateCash();
    if (grandTotal <= 0) {
      showToast("Pehle koi note count daalo");
      return;
    }
    let summary = "💵 Cash Tally Summary — Nova Calculator\n" + "=".repeat(32) + "\n";
    DENOMINATIONS.forEach((d) => {
      const cnt = parseInt(document.getElementById(`noteCount_${d}`)?.value || "0", 10) || 0;
      if (cnt > 0) {
        summary += `₹${d} × ${cnt} = ₹${(cnt * d).toLocaleString()}\n`;
      }
    });
    summary += "=".repeat(32) + "\n";
    summary += `Total Notes: ${totalNotes}\nGrand Total: ₹${grandTotal.toLocaleString()}\n`;
    summary += `(${cashInWordsEl?.textContent || ""})\n`;
    summary += "RV Group LTD | ♥️ BY PANKAJ";

    if (window.AndroidBridge && typeof window.AndroidBridge.shareWhatsApp === "function") {
      window.AndroidBridge.shareWhatsApp("", summary);
    } else {
      window.open("https://wa.me/?text=" + encodeURIComponent(summary), "_blank", "noopener");
    }
  });
}

if (cashCloseBtn) cashCloseBtn.addEventListener("click", drawerControls.close);

export function openCashCalc() {
  calculateCash();
  drawerControls.open();
}

const cashSpeakBtn = document.getElementById("cashSpeakBtn");
if (cashSpeakBtn) {
  cashSpeakBtn.addEventListener("click", () => {
    const { grandTotal } = calculateCash();
    const words = numberToWordsFull(grandTotal.toString(), voiceLang);
    const enWords = numberToWordsFull(grandTotal.toString(), "en");
    showToast(words, 2200);
    speakNumber(words, true, enWords);
    vibrate(8);
  });
}
