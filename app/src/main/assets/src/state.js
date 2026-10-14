// ---------- Calculator state machine (BODMAS-aware, caret-editable) ----------
// This class owns every mutable field the calculator needs (tokens, current entry,
// memory, etc.) and every method that changes them. It does NOT touch the DOM
// directly for rendering — callers (keypad.js) call a method here, then call
// render() themselves. The few cross-cutting side effects this class does need
// (saving to history, enabling the Check/Share buttons, updating the memory badge)
// go through the `hooks` below, wired up once in main.js — this keeps state.js
// free of a dependency on render.js/history.js, which avoids a circular import.
import { OPS, isOp, compute, trimNumber, evaluateExpression } from "./core/engine.js";
import { formatNumber } from "./core/format.js";
import { numberFormat } from "./settings.js";
import { MEMORY_KEY, safeSetItem } from "./storage.js";
import { sfxDigit, sfxOperator, sfxEquals, sfxClear, sfxError } from "./audio.js";
import { showToast } from "./toast.js";

export const hooks = {
  onHistorySave: null,   // (exprText, formattedResult, steps) => void
  onSuccess: null,       // () => void   — called after a successful "="
  onError: null,         // () => void   — called when entering the Error state
  onMemoryChange: null,  // () => void   — called whenever memoryValue changes
};

class CalculatorState {
  constructor() {
    this.tokens = [];
    this.current = "0";
    this.awaitingNewNumber = false;
    this.justEvaluated = false;
    this.frozenExpr = null;
    this.lastCalc = null;

    this.editingTokenIndex = null; // null = editing `current`; otherwise index into tokens[]
    this.caretPos = null;
    this.customCaretActive = false;          // null = caret sits at the end of the active field

    this.memoryValue = parseFloat(localStorage.getItem(MEMORY_KEY) || "0") || 0;
  }

  // ---- active edit target helpers ----
  activeStr() {
    return this.editingTokenIndex === null ? this.current : this.tokens[this.editingTokenIndex];
  }
  setActiveStr(v) {
    if (this.editingTokenIndex === null) this.current = v;
    else this.tokens[this.editingTokenIndex] = v;
  }
  /** Returns true (and exits edit mode) if a token edit was in progress — the
   *  caller should treat that as "consumed" and not also perform its own action. */
  commitTokenEdit() {
    this.customCaretActive = false;
    if (this.editingTokenIndex !== null) {
      this.editingTokenIndex = null;
      this.caretPos = null;
      return true;
    }
    return false;
  }

  // ---- tap-to-edit / caret placement (called from keypad.js's click handlers) ----
  startEditingToken(idx, caretPos) {
    this.editingTokenIndex = idx;
    this.caretPos = caretPos;
    this.customCaretActive = true;
  }
  setCaretOnCurrent(pos) {
    this.editingTokenIndex = null;
    this.caretPos = pos;
    this.customCaretActive = true;
  }
  cycleOperatorAt(idx) {
    const cur = OPS.indexOf(this.tokens[idx]);
    this.tokens[idx] = OPS[(cur + 1) % OPS.length];
  }

  // ---- digit / decimal / backspace ----
  inputDigit(d) {
    if (this.activeStr() === "Error") {
      this.current = d; this.tokens = []; this.awaitingNewNumber = false;
      this.editingTokenIndex = null; this.caretPos = 1;
      this.justEvaluated = false; sfxDigit(d); return;
    }
    if (this.editingTokenIndex === null && this.awaitingNewNumber) {
      this.current = d; this.awaitingNewNumber = false; this.caretPos = 1;
      this.justEvaluated = false; sfxDigit(d); return;
    }
    let s = this.activeStr();
    let pos = this.caretPos === null ? s.length : this.caretPos;
    if (s === "0" && pos === 1) {
      s = d; pos = 1;
    } else if (s.replace(/[-.]/g, "").length < 15) {
      s = s.slice(0, pos) + d + s.slice(pos);
      pos += 1;
    }
    this.setActiveStr(s);
    this.caretPos = pos;
    this.justEvaluated = false;
    sfxDigit(d);
  }

  inputDecimal() {
    if (this.activeStr() === "Error") {
      this.current = "0."; this.tokens = []; this.awaitingNewNumber = false;
      this.editingTokenIndex = null; this.caretPos = 2;
      this.justEvaluated = false; sfxDigit("."); return;
    }
    if (this.editingTokenIndex === null && this.awaitingNewNumber) {
      this.current = "0."; this.awaitingNewNumber = false; this.caretPos = 2;
      this.justEvaluated = false; sfxDigit("."); return;
    }
    let s = this.activeStr();
    let pos = this.caretPos === null ? s.length : this.caretPos;
    if (!s.includes(".")) {
      s = s.slice(0, pos) + "." + s.slice(pos);
      pos += 1;
      this.setActiveStr(s);
    }
    this.caretPos = pos;
    this.justEvaluated = false;
    sfxDigit(".");
  }

  backspace() {
    if (this.activeStr() === "Error") {
      this.current = "0"; this.tokens = []; this.awaitingNewNumber = false;
      this.editingTokenIndex = null; this.caretPos = 1;
      sfxClear(); return;
    }
    if (this.editingTokenIndex === null && this.awaitingNewNumber && this.tokens.length >= 2) {
      this.tokens.pop();
      this.current = this.tokens.pop();
      this.awaitingNewNumber = false;
      this.caretPos = this.current.length;
      sfxClear(); return;
    }
    let s = this.activeStr();
    let pos = this.caretPos === null ? s.length : this.caretPos;
    if (pos > 0) {
      s = s.slice(0, pos - 1) + s.slice(pos);
      pos -= 1;
    }
    if (s === "" || s === "-") { s = "0"; pos = 1; }
    this.setActiveStr(s);
    this.caretPos = pos;
    sfxClear();
  }

  clearAll() {
    if (this.commitTokenEdit()) { sfxClear(); return; }
    this.current = "0";
    this.tokens = [];
    this.awaitingNewNumber = false;
    this.justEvaluated = false;
    this.frozenExpr = null;
    this.caretPos = null;
    this.customCaretActive = false;
    sfxClear();
  }

  toggleSign() {
    let s = this.activeStr();
    if (s === "Error") return;
    const wasNeg = s.startsWith("-");
    if (s !== "0") s = wasNeg ? s.slice(1) : "-" + s;
    this.setActiveStr(s);
    if (this.caretPos !== null) this.caretPos = Math.max(0, this.caretPos + (wasNeg ? -1 : 1));
    sfxDigit("5");
  }

  // "A + B%" / "A − B%" → B% means B percent OF A (400 − 20% = 400 − 80 = 320).
  // "A × B%" / "A ÷ B%" → B% is just B/100, since the multiplication already scales it.
  percent() {
    const s = this.activeStr();
    if (s === "Error") return;
    let result;
    if (this.editingTokenIndex === null && this.tokens.length >= 2 && isOp(this.tokens[this.tokens.length - 1])) {
      const prev = parseFloat(this.tokens[this.tokens.length - 2]);
      const op = this.tokens[this.tokens.length - 1];
      const cur = parseFloat(s);
      result = (op === "+" || op === "−") ? (prev * cur) / 100 : cur / 100;
    } else {
      result = parseFloat(s) / 100;
    }
    const val = trimNumber(result);
    this.setActiveStr(val);
    this.caretPos = val.length;
    sfxOperator();
  }

  setOperator(op) {
    if (this.activeStr() === "Error") return;
    if (this.commitTokenEdit()) { sfxOperator(); return; }
    if (this.awaitingNewNumber && this.tokens.length) {
      this.tokens[this.tokens.length - 1] = op; // change your mind about the operator
    } else {
      this.tokens.push(this.current, op);
      this.awaitingNewNumber = true;
    }
    this.justEvaluated = false;
    this.customCaretActive = false;
    sfxOperator();
  }

  equals() {
    if (this.activeStr() === "Error") return;
    if (this.commitTokenEdit()) { sfxOperator(); return; }

    let finalTokens = this.tokens.slice();
    if (!this.awaitingNewNumber) {
      finalTokens.push(this.current);
    } else if (finalTokens.length && isOp(finalTokens[finalTokens.length - 1])) {
      finalTokens.pop();
    }
    if (!finalTokens.length) return;

    const { error, result, steps } = evaluateExpression(finalTokens);
    const exprText = finalTokens.map((t, i) => (i % 2 === 0 ? formatNumber(t, numberFormat) : t)).join(" ");

    if (error) {
      this.current = "Error";
      this.tokens = [];
      this.awaitingNewNumber = false;
      this.frozenExpr = null;
      sfxError();
      hooks.onError?.();
      return;
    }

    const formattedResult = formatNumber(result, numberFormat);
    hooks.onHistorySave?.(exprText, formattedResult, steps);
    this.lastCalc = { expr: exprText, result: formattedResult, steps };

    this.current = result;
    this.tokens = [];
    this.awaitingNewNumber = true;
    this.justEvaluated = true;
    this.caretPos = null;
    this.customCaretActive = false;
    this.frozenExpr = `${exprText} =`;
    sfxEquals();
    hooks.onSuccess?.();
  }

  applySqrt() {
    const s = this.activeStr();
    if (s === "Error") return;
    const n = parseFloat(s);
    if (n < 0) {
      this.current = "Error"; this.tokens = []; this.awaitingNewNumber = false;
      this.editingTokenIndex = null; this.frozenExpr = null;
      sfxError(); hooks.onError?.(); return;
    }
    const val = trimNumber(Math.sqrt(n));
    this.setActiveStr(val);
    this.caretPos = val.length;
    sfxOperator();
  }

  applySquare() {
    const s = this.activeStr();
    if (s === "Error") return;
    const val = trimNumber(Math.pow(parseFloat(s), 2));
    this.setActiveStr(val);
    this.caretPos = val.length;
    sfxOperator();
  }

  applyCube() {
    const s = this.activeStr();
    if (s === "Error") return;
    const val = trimNumber(Math.pow(parseFloat(s), 3));
    this.setActiveStr(val);
    this.caretPos = val.length;
    sfxOperator();
  }

  applyReciprocal() {
    const s = this.activeStr();
    if (s === "Error") return;
    const n = parseFloat(s);
    if (n === 0) {
      this.current = "Error"; this.tokens = []; this.awaitingNewNumber = false;
      this.editingTokenIndex = null; this.frozenExpr = null;
      sfxError(); hooks.onError?.(); return;
    }
    const val = trimNumber(1 / n);
    this.setActiveStr(val);
    this.caretPos = val.length;
    sfxOperator();
  }

  applyTrig(fn) {
    const s = this.activeStr();
    if (s === "Error") return;
    const deg = parseFloat(s);
    if (isNaN(deg)) return;
    const rad = (deg * Math.PI) / 180;
    let res;
    if (fn === "sin") res = Math.sin(rad);
    else if (fn === "cos") res = Math.cos(rad);
    else if (fn === "tan") {
      if (Math.abs(deg % 180) === 90) {
        this.current = "Error"; this.tokens = []; this.awaitingNewNumber = false;
        this.editingTokenIndex = null; this.frozenExpr = null;
        sfxError(); hooks.onError?.(); return;
      }
      res = Math.tan(rad);
    }
    if (Math.abs(res) < 1e-12) res = 0;
    const val = trimNumber(res);
    this.setActiveStr(val);
    this.caretPos = val.length;
    sfxOperator();
  }

  insertPi() {
    if (this.activeStr() === "Error") return;
    const val = trimNumber(Math.PI);
    this.setActiveStr(val);
    this.caretPos = null;
    this.awaitingNewNumber = false;
    this.justEvaluated = false;
    sfxDigit("5");
  }

  // ---- Paste a number from the clipboard (menu item / Ctrl+V) ----
  // Accepts messy input — currency symbols, thousands-separator commas, stray
  // whitespace, surrounding text — and pulls out the first valid number it
  // can find, same 15-significant-digit ceiling as typing digit-by-digit.
  // Returns false (and changes nothing) if no usable number was found.
  pasteNumber(rawText) {
    if (typeof rawText !== "string") return false;
    const match = rawText.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
    if (!match) return false;
    const val = match[0];
    if (val.replace(/[-.]/g, "").length > 15) return false;

    if (this.activeStr() === "Error") {
      this.tokens = []; this.awaitingNewNumber = false; this.editingTokenIndex = null;
    }
    this.setActiveStr(val);
    this.caretPos = val.length;
    this.awaitingNewNumber = false;
    this.justEvaluated = false;
    this.customCaretActive = false;
    sfxOperator();
    return true;
  }

  // ---- Memory (M+ / M− / MR / MC) — persists across sessions ----
  #persistMemory() { safeSetItem(MEMORY_KEY, String(this.memoryValue)); }

  memoryClear() {
    this.memoryValue = 0;
    this.#persistMemory();
    sfxClear();
    if (navigator.vibrate) { try { navigator.vibrate(6); } catch (e) {} }
    hooks.onMemoryChange?.();
  }
  memoryRecall() {
    if (this.activeStr() === "Error") return;
    const val = trimNumber(this.memoryValue);
    this.setActiveStr(val);
    this.caretPos = null;
    this.awaitingNewNumber = false;
    this.justEvaluated = false;
    this.customCaretActive = false;
    sfxOperator();
  }
  memoryAdd(sign) {
    const s = this.activeStr();
    if (s === "Error") return;
    const n = parseFloat(s);
    if (isNaN(n)) return;
    this.memoryValue += sign * n;
    this.#persistMemory();
    sfxOperator();
    if (navigator.vibrate) { try { navigator.vibrate(10); } catch (e) {} }
    showToast((sign > 0 ? "M+ " : "M− ") + formatNumber(trimNumber(n), numberFormat));
    hooks.onMemoryChange?.();
  }
}

export const state = new CalculatorState();
