// ---------- Citizen/Casio Style Step-by-Step CHECK & Review ----------
import { checkKey, checkOverlay, checkOverlayText, checkOverlayProgress, exprLine, resultLine, previewLine } from "./dom.js";
import { state } from "./state.js";
import { formatNumber } from "./core/format.js";
import { numberFormat } from "./settings.js";
import { sfxOperator } from "./audio.js";
import { showToast } from "./toast.js";

function fmt(numStr) { return formatNumber(numStr, numberFormat); }

let checkSeq = [];
let checkIndex = -1;
let checkAutoTimer = null;
let isCheckActive = false;

export const OP_META = {
  "+": { cls: "op-plus", label: "+" },
  "−": { cls: "op-minus", label: "−" },
  "×": { cls: "op-mul", label: "×" },
  "÷": { cls: "op-div", label: "÷" },
};

function getActiveCalculation() {
  if (state.lastCalc && state.lastCalc.steps && state.lastCalc.steps.length > 0) {
    return state.lastCalc;
  }
  // Fallback: check most recent entry from saved History
  try {
    const history = JSON.parse(localStorage.getItem("nova-calc-history-v2")) || [];
    if (history.length > 0 && history[0].steps && history[0].steps.length > 0) {
      return history[0];
    }
  } catch (e) {}
  return null;
}

function buildCheckSequence(calc) {
  const seq = calc.steps.map((s, i) => ({
    stepNum: i + 1,
    totalSteps: calc.steps.length,
    a: s.a,
    op: s.op,
    b: s.b,
    result: s.result,
    isFinal: false
  }));
  seq.push({
    stepNum: calc.steps.length + 1,
    totalSteps: calc.steps.length,
    result: calc.result,
    isFinal: true
  });
  return seq;
}

function renderCheckStep(step) {
  checkOverlay.hidden = false;
  if (step.isFinal) {
    checkOverlayText.innerHTML = `<span class="ct-final">Final = ${fmt(step.result)}</span>`;
    checkOverlayProgress.textContent = `[ FINAL ANSWER ]`;
  } else {
    const meta = OP_META[step.op] || { cls: "op-plus" };
    checkOverlayText.innerHTML =
      `<span class="ct-num">${fmt(step.a)}</span>` +
      `<span class="ct-op ${meta.cls}">${step.op}</span>` +
      `<span class="ct-num">${fmt(step.b)}</span>` +
      `<span class="ct-eq">=</span>` +
      `<span class="ct-result">${fmt(step.result)}</span>`;
    checkOverlayProgress.textContent = `CHECK • STEP ${step.stepNum} of ${step.totalSteps}`;
  }
}

export function advanceCheck() {
  const calc = getActiveCalculation();
  if (!calc) {
    showToast("Pehle koi calculation karein, fir CHECK karein");
    if (window.vibrate) window.vibrate(8);
    return;
  }

  if (!isCheckActive) {
    checkSeq = buildCheckSequence(calc);
    checkIndex = 0;
    isCheckActive = true;
    checkKey.classList.add("check-reviewing");
  } else {
    checkIndex++;
    if (checkIndex >= checkSeq.length) {
      dismissCheckOverlay();
      return;
    }
  }

  renderCheckStep(checkSeq[checkIndex]);
  sfxOperator();
  if (window.vibrate) window.vibrate(6);
}

export function dismissCheckOverlay() {
  if (!isCheckActive) return;
  isCheckActive = false;
  checkIndex = -1;
  checkOverlay.hidden = true;
  checkKey.classList.remove("check-reviewing");
  if (checkAutoTimer) {
    clearInterval(checkAutoTimer);
    checkAutoTimer = null;
  }
}

// Auto-play review on long-press (1.5 seconds)
let checkHoldTimer = null;
if (checkKey) {
  checkKey.disabled = false; // Never permanently disabled!

  checkKey.addEventListener("pointerdown", () => {
    checkHoldTimer = setTimeout(() => {
      startAutoReview();
    }, 1500);
  });

  ["pointerup", "pointerleave", "pointercancel"].forEach((ev) =>
    checkKey.addEventListener(ev, () => clearTimeout(checkHoldTimer))
  );
}

function startAutoReview() {
  const calc = getActiveCalculation();
  if (!calc) return;
  checkSeq = buildCheckSequence(calc);
  checkIndex = 0;
  isCheckActive = true;
  checkKey.classList.add("check-reviewing");
  renderCheckStep(checkSeq[0]);
  if (window.vibrate) window.vibrate([10, 20, 10]);

  clearInterval(checkAutoTimer);
  checkAutoTimer = setInterval(() => {
    checkIndex++;
    if (checkIndex >= checkSeq.length) {
      clearInterval(checkAutoTimer);
      checkAutoTimer = null;
      setTimeout(dismissCheckOverlay, 900);
      return;
    }
    renderCheckStep(checkSeq[checkIndex]);
    sfxOperator();
  }, 900);
}

export function onCalculationSuccess() {
  dismissCheckOverlay();
}
