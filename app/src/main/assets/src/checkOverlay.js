// ---------- Check feature: step-by-step breakdown, colorful typewriter overlay on the LCD ----------
import { checkKey, checkOverlay, checkOverlayText, checkOverlayProgress } from "./dom.js";
import { state } from "./state.js";
import { formatNumber } from "./core/format.js";
import { numberFormat } from "./settings.js";
import { sfxOperator, vibrate } from "./audio.js";

function fmt(numStr) { return formatNumber(numStr, numberFormat); }

let checkSeq = [];
let checkIndex = -1;
let checkHoldTimer = null;
let checkAutoTimer = null;
let checkLongPressFired = false;
let checkActive = false;

export const OP_META = {
  "+": { cls: "op-plus", label: "+" },
  "−": { cls: "op-minus", label: "−" },
  "×": { cls: "op-mul", label: "×" },
  "÷": { cls: "op-div", label: "÷" },
};

// no "Type kiya" intro — jump straight into the BODMAS steps, then the final answer
function buildCheckSequence(calc) {
  const seq = calc.steps.map((s) => ({ type: "step", a: s.a, op: s.op, b: s.b, result: s.result }));
  seq.push({ type: "final", result: calc.result });
  return seq;
}

function frameHTML(frame) {
  if (frame.type === "final") {
    return `<span class="ct-final">Final Answer = ${fmt(frame.result)}</span>`;
  }
  const meta = OP_META[frame.op] || { cls: "op-plus" };
  return (
    `<span class="ct-num">${fmt(frame.a)}</span>` +
    `<span class="ct-op ${meta.cls}">${frame.op}</span>` +
    `<span class="ct-num">${fmt(frame.b)}</span>` +
    `<span class="ct-eq">=</span>` +
    `<span class="ct-result">${fmt(frame.result)}</span>`
  );
}

// CSS can't smoothly animate to width:auto, so measure the real pixel width first,
// then transition from 0 to that exact value with a stepped (typewriter) timing.
function typewriterReveal(el, durationMs) {
  el.style.transition = "none";
  el.style.width = "auto";
  const target = el.scrollWidth;
  el.style.width = "0px";
  void el.offsetWidth; // force reflow so width:0 registers before the transition starts
  const len = el.textContent.length || 1;
  el.style.transition = `width ${durationMs}ms steps(${len}, end)`;
  requestAnimationFrame(() => { el.style.width = target + "px"; });
}

function showCheckStep(i) {
  if (!checkSeq.length) return;
  checkActive = true;
  checkIndex = ((i % checkSeq.length) + checkSeq.length) % checkSeq.length;
  const frame = checkSeq[checkIndex];

  checkOverlay.hidden = false;
  checkOverlayText.innerHTML = frameHTML(frame);
  checkOverlayProgress.textContent = `${checkIndex + 1}/${checkSeq.length}`;
  typewriterReveal(checkOverlayText, 400);
}
function hideCheckPanel() {
  checkActive = false;
  checkIndex = -1;
  checkOverlay.hidden = true;
  clearInterval(checkAutoTimer);
  checkAutoTimer = null;
}
export function advanceCheck() {
  if (!state.lastCalc) return;
  if (!checkActive) { checkSeq = buildCheckSequence(state.lastCalc); showCheckStep(0); }
  else if (checkIndex >= checkSeq.length - 1) hideCheckPanel();
  else showCheckStep(checkIndex + 1);
  sfxOperator();
}
function startAutoPlay() {
  if (!state.lastCalc) return;
  checkSeq = buildCheckSequence(state.lastCalc);
  showCheckStep(0);
  vibrate([10, 20, 10]);
  clearInterval(checkAutoTimer);
  checkAutoTimer = setInterval(() => {
    if (checkIndex >= checkSeq.length - 1) {
      clearInterval(checkAutoTimer);
      checkAutoTimer = null;
      setTimeout(hideCheckPanel, 900);
      return;
    }
    showCheckStep(checkIndex + 1);
  }, 900); // fast auto-advance
}

checkKey.addEventListener("pointerdown", () => {
  if (checkKey.disabled) return;
  checkLongPressFired = false;
  checkHoldTimer = setTimeout(() => { checkLongPressFired = true; startAutoPlay(); }, 3000);
});
checkKey.addEventListener("pointerup", () => { clearTimeout(checkHoldTimer); });
["pointerleave", "pointercancel"].forEach((ev) =>
  checkKey.addEventListener(ev, () => clearTimeout(checkHoldTimer))
);

/** Called by state.js's onSuccess hook after every successful "=" */
export function onCalculationSuccess() {
  checkKey.disabled = false;
  hideCheckPanel();
}

/** Any other key (AC, digits, operators...) dismisses an in-progress check
 *  overlay immediately — it should never require finishing the sequence
 *  just to get back to the calculator. */
export function dismissCheckOverlay() {
  if (checkActive) hideCheckPanel();
}
