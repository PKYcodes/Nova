// ---------- Screen rendering ----------
import { exprLine, resultLine, previewLine, entryBadge, entryCountEl, memBadge, calcCase } from "./dom.js";
import { state } from "./state.js";
import { isOp, evaluateExpression } from "./core/engine.js";
import { formatNumber } from "./core/format.js";
import { numberFormat, onFormatChange } from "./settings.js";
import { sfxOperator } from "./audio.js";

function fmt(numStr) { return formatNumber(numStr, numberFormat); }

const RESULT_FONT_STEPS = [54, 46, 38, 31, 25, 20, 16];
const PREVIEW_FONT_STEPS = [26, 22, 19, 16, 14];
let measureCtx = null;

function fitLineFont(el, steps) {
  if (!measureCtx) measureCtx = document.createElement("canvas").getContext("2d");
  const cs = getComputedStyle(el);
  const available = Math.max(120, el.clientWidth - 4);
  const text = el.textContent || "";
  const minSize = steps[steps.length - 1];
  let chosen = minSize;
  for (const size of steps) {
    measureCtx.font = `${cs.fontWeight} ${size}px ${cs.fontFamily}`;
    if (measureCtx.measureText(text).width <= available || size === minSize) {
      chosen = size;
      break;
    }
  }
  el.style.fontSize = chosen + "px";
}

// Renders a string as tappable char positions.
// Formats with commas when showCaret is false, while still keeping data-caret-pos on each raw digit
// so tapping any digit in the big number places the cursor at that exact digit!
function renderTappableNumberHTML(rawStr, pos, showCaret = false) {
  if (showCaret) {
    const p = pos === null || pos === undefined ? rawStr.length : Math.max(0, Math.min(pos, rawStr.length));
    let html = `<span class="char-pos" data-caret-pos="0">${p === 0 ? '<span class="caret"></span>' : ""}</span>`;
    for (let i = 0; i < rawStr.length; i++) {
      html += `<span class="char-pos" data-caret-pos="${i + 1}">${rawStr[i]}${p === i + 1 ? '<span class="caret"></span>' : ""}</span>`;
    }
    return html;
  }

  // Format with Indian/International commas while preserving raw digit index on each character
  const formatted = fmt(rawStr);
  let rawIdx = 0;
  let html = `<span class="char-pos" data-caret-pos="0"></span>`;
  for (let i = 0; i < formatted.length; i++) {
    const ch = formatted[i];
    if (ch === ",") {
      html += `<span class="char-comma">,</span>`;
    } else {
      rawIdx++;
      html += `<span class="char-pos" data-caret-pos="${rawIdx}">${ch}</span>`;
    }
  }
  return html;
}

function renderExprLine() {
  if (state.justEvaluated && state.frozenExpr) {
    exprLine.textContent = state.frozenExpr;
    exprLine.classList.remove("editable");
  } else if (!state.tokens.length) {
    exprLine.textContent = "\u00A0";
    exprLine.classList.remove("editable");
  } else {
    exprLine.classList.add("editable");
    exprLine.innerHTML = state.tokens.map((tok, i) => {
      if (i % 2 === 0) {
        if (state.editingTokenIndex === i) {
          return `<span class="expr-chip editing" data-idx="${i}">${renderTappableNumberHTML(tok, state.caretPos, true)}</span>`;
        }
        return `<span class="expr-chip" data-idx="${i}">${fmt(tok)}</span>`;
      }
      return `<span class="expr-op" data-op-idx="${i}">${tok}</span>`;
    }).join(" ");
  }
  exprLine.scrollTop = exprLine.scrollHeight;
  exprLine.scrollLeft = exprLine.scrollWidth;
}

exprLine.addEventListener("click", (e) => {
  if (state.justEvaluated) return;

  const opSpan = e.target.closest(".expr-op");
  if (opSpan) {
    const idx = parseInt(opSpan.dataset.opIdx, 10);
    state.cycleOperatorAt(idx);
    sfxOperator();
    if (window.vibrate) window.vibrate(8);
    render();
    return;
  }

  const chip = e.target.closest(".expr-chip");
  if (!chip) return;
  const idx = parseInt(chip.dataset.idx, 10);
  const posEl = e.target.closest("[data-caret-pos]");
  const caretPos = posEl ? parseInt(posEl.dataset.caretPos, 10) : state.tokens[idx].length;
  state.startEditingToken(idx, caretPos);
  sfxOperator();
  if (window.vibrate) window.vibrate(6);
  render();
});

resultLine.addEventListener("click", (e) => {
  if (state.current === "Error" || state.justEvaluated) return;
  const posEl = e.target.closest("[data-caret-pos]");
  if (!posEl) return;
  state.setCaretOnCurrent(parseInt(posEl.dataset.caretPos, 10));
  if (window.vibrate) window.vibrate(6);
  render();
});

function renderLivePreview() {
  if (state.editingTokenIndex !== null || state.justEvaluated || state.current === "Error") {
    previewLine.textContent = "\u00A0";
    return;
  }
  let evalTokens = state.tokens.slice();
  if (!state.awaitingNewNumber) {
    evalTokens = evalTokens.concat([state.current]);
  } else if (evalTokens.length && isOp(evalTokens[evalTokens.length - 1])) {
    evalTokens = evalTokens.slice(0, -1);
  }
  if (evalTokens.length < 3) {
    previewLine.textContent = "\u00A0";
    return;
  }
  const { error, result } = evaluateExpression(evalTokens);
  previewLine.textContent = error ? "\u00A0" : `= ${fmt(result)}`;
  fitLineFont(previewLine, PREVIEW_FONT_STEPS);
}

function countEntries() {
  if (state.justEvaluated && state.lastCalc) return state.lastCalc.steps.length + 1;
  if (state.tokens.length === 0 && state.current === "0" && !state.awaitingNewNumber) return 0;
  const committed = state.tokens.length / 2;
  return committed + (state.awaitingNewNumber ? 0 : 1);
}

function renderEntryBadge() {
  const n = countEntries();
  entryBadge.hidden = n === 0;
  entryCountEl.textContent = n;
}

export function updateMemoryBadge() {
  memBadge.hidden = state.memoryValue === 0;
}

export function pulseSuccess() {
  calcCase.classList.add("success-glow");
  setTimeout(() => calcCase.classList.remove("success-glow"), 500);
}

export function render(animate = true) {
  if (state.current === "Error") {
    resultLine.classList.remove("active-caret");
    resultLine.textContent = "Error";
  } else if (state.editingTokenIndex === null && !state.justEvaluated) {
    const showCaret = Boolean(state.customCaretActive && !state.awaitingNewNumber);
    resultLine.classList.toggle("active-caret", showCaret);
    resultLine.innerHTML = renderTappableNumberHTML(state.current, state.caretPos, showCaret);
  } else {
    resultLine.classList.remove("active-caret");
    resultLine.textContent = fmt(state.current);
  }

  fitLineFont(resultLine, RESULT_FONT_STEPS);
  resultLine.scrollLeft = resultLine.scrollWidth;
  renderExprLine();
  renderLivePreview();
  renderEntryBadge();

  resultLine.classList.remove("flip", "error");
  if (state.current === "Error") {
    void resultLine.offsetWidth;
    resultLine.classList.add("error");
  } else if (animate) {
    void resultLine.offsetWidth;
    resultLine.classList.add("flip");
  }
}

onFormatChange.fn = () => render();
