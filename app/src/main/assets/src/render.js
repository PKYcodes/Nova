// ---------- Screen rendering ----------
import { exprLine, resultLine, previewLine, entryBadge, entryCountEl, memBadge, calcCase } from "./dom.js";
import { state } from "./state.js";
import { isOp, evaluateExpression } from "./core/engine.js";
import { formatNumber } from "./core/format.js";
import { numberFormat, onFormatChange } from "./settings.js";
import { sfxOperator } from "./audio.js";

function fmt(numStr) { return formatNumber(numStr, numberFormat); }

// Picks the largest font size (from a fixed scale) that still lets the full
// number fit inside the LCD without being scrolled out of view. Character
// count alone isn't reliable — the same digit count can render at very
// different pixel widths depending on screen size — so this measures the
// actual text width and steps down until it fits. Measured via a detached
// canvas (not resultLine's own layout) because .lcd-result has a CSS
// transition on font-size, which makes live scrollWidth reads unreliable
// when changed multiple times in the same tick.
const RESULT_FONT_STEPS = [58, 48, 39, 30, 22, 18, 15];
let measureCtx = null;
function fitResultFont() {
  if (!measureCtx) measureCtx = document.createElement("canvas").getContext("2d");
  const cs = getComputedStyle(resultLine);
  const available = resultLine.clientWidth;
  const text = resultLine.textContent;
  const minSize = RESULT_FONT_STEPS[RESULT_FONT_STEPS.length - 1];
  let chosen = minSize;
  for (const size of RESULT_FONT_STEPS) {
    measureCtx.font = `${cs.fontWeight} ${size}px ${cs.fontFamily}`;
    if (measureCtx.measureText(text).width <= available || size === minSize) { chosen = size; break; }
  }
  resultLine.style.fontSize = chosen + "px";
}

// Renders a string as tappable char positions with a blinking caret, so the user
// can tap anywhere in a number to place the cursor there and edit mid-number.
function renderCaretHTML(str, pos) {
  const p = pos === null || pos === undefined ? str.length : Math.max(0, Math.min(pos, str.length));
  let html = `<span class="char-pos" data-caret-pos="0">${p === 0 ? '<span class="caret"></span>' : ""}</span>`;
  for (let i = 0; i < str.length; i++) {
    html += `<span class="char-pos" data-caret-pos="${i + 1}">${str[i]}${p === i + 1 ? '<span class="caret"></span>' : ""}</span>`;
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
          return `<span class="expr-chip editing" data-idx="${i}">${renderCaretHTML(tok, state.caretPos)}</span>`;
        }
        return `<span class="expr-chip" data-idx="${i}">${fmt(tok)}</span>`;
      }
      return `<span class="expr-op" data-op-idx="${i}">${tok}</span>`;
    }).join(" ");
  }
  // keep the most recently typed part in view instead of it scrolling off the right edge
  exprLine.scrollLeft = exprLine.scrollWidth;
}

// tap any previous number in the expression to drop a cursor into it and edit in place;
// tap an operator to cycle it (+ → − → × → ÷ → +) — fixes a mis-typed operator without
// having to retype the whole expression
exprLine.addEventListener("click", (e) => {
  if (state.justEvaluated) return;

  const opSpan = e.target.closest(".expr-op");
  if (opSpan) {
    const idx = parseInt(opSpan.dataset.opIdx, 10);
    state.cycleOperatorAt(idx);
    sfxOperator();
    if (navigator.vibrate) { try { navigator.vibrate(8); } catch (e) {} }
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
  if (navigator.vibrate) { try { navigator.vibrate(6); } catch (e) {} }
  render();
});

// tap within the big live number to move the cursor there too
resultLine.addEventListener("click", (e) => {
  if (state.current === "Error" || state.justEvaluated) return;
  const posEl = e.target.closest(".char-pos");
  if (!posEl) return;
  state.setCaretOnCurrent(parseInt(posEl.dataset.caretPos, 10));
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
    evalTokens = evalTokens.slice(0, -1); // dangling operator — preview what's committed so far
  }
  if (evalTokens.length < 3) {
    previewLine.textContent = "\u00A0";
    return;
  }
  const { error, result } = evaluateExpression(evalTokens);
  previewLine.textContent = error ? "\u00A0" : `= ${fmt(result)}`;
}

function countEntries() {
  // After "=", tokens are cleared (the expression is done) — but the entry
  // count should keep showing how many numbers were in the calculation just
  // completed, not vanish, until the user starts typing a new one.
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
    resultLine.textContent = "Error";
  } else if (state.editingTokenIndex === null && !state.justEvaluated) {
    if (state.caretPos !== null && state.current !== "0") {
      resultLine.classList.add("active-caret");
      resultLine.innerHTML = renderCaretHTML(state.current, state.caretPos);
    } else {
      resultLine.classList.remove("active-caret");
      resultLine.textContent = fmt(state.current);
    }
  } else {
    resultLine.textContent = fmt(state.current);
  }
  fitResultFont();
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

// re-render immediately whenever the number-format setting changes (menu toggle)
onFormatChange.fn = () => render();
