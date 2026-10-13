// ---------- History (kept until the user deletes it — no auto-trim) ----------
import {
  drawer, drawerBackdrop, drawerHandle, tapeScroll, tapeList, tapeEmpty, clearHistoryBtn,
  selectModeBtn, selectionBar, selectionCount, selectDeleteBtn, selectCancelBtn,
  exportHistoryBtn, historySearchInput, historySearchClear, tapeNoMatch,
} from "./dom.js";
import { HISTORY_KEY, LAST_EXPORT_KEY, LAST_BACKUP_NUDGE_KEY, safeSetItem } from "./storage.js";
import { state } from "./state.js";
import { render } from "./render.js";
import { makeDrawerControls } from "./drawers.js";
import { formatNumber } from "./core/format.js";
import { numberFormat } from "./settings.js";
import { sfxClear } from "./audio.js";
import { showToast } from "./toast.js";
import { shareAsImage, shareViaWhatsApp } from "./shareImage.js";
import { OP_META } from "./checkOverlay.js";

function fmt(numStr) { return formatNumber(numStr, numberFormat); }

export const historyDrawer = makeDrawerControls(drawer, drawerBackdrop, drawerHandle, tapeScroll);

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; }
  catch (e) { return []; }
}
function persistHistory(entries) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch (e) {
    // storage genuinely full — drop the oldest 20% once and retry, rather than losing everything
    const trimmed = entries.slice(0, Math.floor(entries.length * 0.8));
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed)); } catch (e2) {}
  }
}
function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---- Gentle backup reminder ----
// The whole history lives only in this browser's localStorage — nothing is
// synced anywhere. Once there's a meaningful amount of it, nudge (at most
// once a week) toward the existing "export as .txt" button, so people don't
// lose months of calculations to a cleared cache or a phone reset.
const BACKUP_REMINDER_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;
const BACKUP_REMINDER_MIN_ENTRIES = 20;
function maybeNudgeBackup(entryCount) {
  if (entryCount < BACKUP_REMINDER_MIN_ENTRIES) return;
  const lastExport = Number(localStorage.getItem(LAST_EXPORT_KEY) || 0);
  const lastNudge = Number(localStorage.getItem(LAST_BACKUP_NUDGE_KEY) || 0);
  if (Date.now() - Math.max(lastExport, lastNudge) < BACKUP_REMINDER_INTERVAL_MS) return;
  safeSetItem(LAST_BACKUP_NUDGE_KEY, String(Date.now()));
  showToast(`${entryCount} calculations saved sirf is device par — ⋮ menu se backup export kar lo`);
}

/** Called from state.js's onHistorySave hook after every successful "=" */
export function saveHistory(expr, result, steps) {
  const entries = loadHistory();
  entries.unshift({ id: makeId(), expr, result, steps, ts: Date.now() });
  persistHistory(entries);
  renderHistory();
  maybeNudgeBackup(entries.length);
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
  exitSelectionMode();
  sfxClear();
  renderHistory();
}
function dateGroupLabel(ts) {
  const d = new Date(ts);
  const now = new Date();
  const startOfDay = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(d)) / 86400000);
  if (diffDays === 0) return "Aaj";
  if (diffDays === 1) return "Kal";
  const opts = { day: "2-digit", month: "short" };
  if (d.getFullYear() !== now.getFullYear()) opts.year = "numeric";
  return d.toLocaleDateString([], opts);
}
function formatTime(ts) {
  // date context now comes from the "Aaj / Kal / 12 Aug" group header above
  // each day's entries, so this only needs the time.
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function renderStepsHTML(steps) {
  if (!steps || steps.length < 2) return "";
  const items = steps.map((s) => {
    const meta = OP_META[s.op] || { cls: "op-plus", label: s.op };
    return `
      <li class="tape-step">
        <span class="step-badge ${meta.cls}">${meta.label}</span>
        <span class="step-value">${fmt(s.a)} ${s.op} ${fmt(s.b)}</span>
        <span class="step-arrow">→</span>
        <span class="step-running">${fmt(s.result)}</span>
      </li>`;
  }).join("");
  return `<ul class="tape-steps">${items}</ul>`;
}

let selectionMode = false;
let selectedIds = new Set();
let searchQuery = "";

function matchesSearch(entry, q) {
  if (entry.expr.toLowerCase().includes(q)) return true;
  if (entry.result.toLowerCase().includes(q)) return true;
  if (entry.note && entry.note.toLowerCase().includes(q)) return true;
  return false;
}

let searchDebounceTimer = null;
historySearchInput.addEventListener("input", () => {
  // instant: just the clear (✕) button visibility, so the UI doesn't feel laggy
  historySearchClear.hidden = !historySearchInput.value;
  // debounced: the actual localStorage read + filter + re-render, so a fast
  // typist doesn't trigger a full history parse on every single keystroke
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    searchQuery = historySearchInput.value.trim().toLowerCase();
    renderHistory();
  }, 300);
});
historySearchClear.addEventListener("click", () => {
  clearTimeout(searchDebounceTimer);
  historySearchInput.value = "";
  searchQuery = "";
  historySearchClear.hidden = true;
  renderHistory();
  historySearchInput.focus();
});

function enterSelectionMode() {
  if (selectionMode) return;
  selectionMode = true;
  selectModeBtn.classList.add("active");
  selectModeBtn.textContent = "done";
  selectionBar.hidden = false;
  renderHistory();
}
function exitSelectionMode() {
  selectionMode = false;
  selectedIds.clear();
  selectModeBtn.classList.remove("active");
  selectModeBtn.textContent = "select";
  selectionBar.hidden = true;
  renderHistory();
}
function toggleSelect(id) {
  if (selectedIds.has(id)) selectedIds.delete(id);
  else selectedIds.add(id);
  selectionCount.textContent = `${selectedIds.size} selected`;
  selectDeleteBtn.disabled = selectedIds.size === 0;
  renderHistory();
}
selectModeBtn.addEventListener("click", () => {
  if (selectionMode) exitSelectionMode();
  else enterSelectionMode();
});
selectCancelBtn.addEventListener("click", exitSelectionMode);
selectDeleteBtn.addEventListener("click", () => {
  if (!selectedIds.size) return;
  if (!confirm(`${selectedIds.size} calculation delete karein? Ye undo nahi ho sakta.`)) return;
  const remaining = loadHistory().filter((entry) => !selectedIds.has(entry.id));
  persistHistory(remaining);
  exitSelectionMode();
});

export function renderHistory() {
  const allEntries = loadHistory();
  const entries = searchQuery ? allEntries.filter((e) => matchesSearch(e, searchQuery)) : allEntries;
  tapeList.innerHTML = "";
  tapeEmpty.hidden = allEntries.length !== 0;
  tapeNoMatch.hidden = !(allEntries.length !== 0 && entries.length === 0);
  selectionCount.textContent = `${selectedIds.size} selected`;
  selectDeleteBtn.disabled = selectedIds.size === 0;

  let lastGroup = null;
  entries.forEach((entry) => {
    const group = dateGroupLabel(entry.ts);
    if (group !== lastGroup) {
      const header = document.createElement("li");
      header.className = "tape-date-header";
      header.textContent = group;
      tapeList.appendChild(header);
      lastGroup = group;
    }
    const li = document.createElement("li");
    li.className = "tape-item" + (selectedIds.has(entry.id) ? " selected" : "");
    li.innerHTML = `
      <div class="tape-top">
        ${selectionMode ? `<span class="tape-check ${selectedIds.has(entry.id) ? "checked" : ""}"></span>` : ""}
        <div class="tape-expr">${entry.expr}</div>
        <div class="tape-time">${formatTime(entry.ts)}</div>
      </div>
      <div class="tape-result">= ${entry.result}</div>
      ${renderStepsHTML(entry.steps)}
      <div class="tape-actions">
        <div class="tape-note ${entry.note ? "has-note" : "add-note"}" data-note-for="${entry.id}">
          ${entry.note ? "🏷 " + entry.note : "+ note"}
        </div>
        <button class="tape-share" data-share-for="${entry.id}" aria-label="Share as image">
          <svg viewBox="0 0 24 24" width="14" height="14"><circle cx="18" cy="5" r="2.4" stroke="currentColor" stroke-width="1.8" fill="none"/><circle cx="6" cy="12" r="2.4" stroke="currentColor" stroke-width="1.8" fill="none"/><circle cx="18" cy="19" r="2.4" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M8.1 10.7l7.8-4.4M8.1 13.3l7.8 4.4" stroke="currentColor" stroke-width="1.8"/></svg>
        </button>
        <button class="tape-share tape-whatsapp" data-whatsapp-for="${entry.id}" aria-label="Share via WhatsApp">
          <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M8.5 8.7c.2-.5.5-.5.8-.5h.6c.2 0 .4 0 .6.5.2.5.7 1.7.7 1.9s0 .3-.1.5c-.2.3-.4.5-.6.7-.2.2-.4.4-.2.7.3.5 1 1.4 2.1 2 .3.2.6.4.9.1.3-.3.9-1 1.1-1.3.2-.3.5-.2.8-.1l1.7.8c.2.1.4.2.5.4.1.3.1 1-.2 1.6-.3.6-1.5 1.2-2.1 1.2-.6 0-1.4.1-4.6-1.9-2.6-1.6-3.6-4.3-3.7-4.5-.1-.2-.9-1.2-.9-2.3 0-1.1.6-1.6.8-1.8z" fill="currentColor"/></svg>
        </button>
      </div>
    `;

    li.querySelector(".tape-note").addEventListener("click", (e) => {
      e.stopPropagation();
      const text = window.prompt("Note likho is calculation ke liye:", entry.note || "");
      if (text === null) return;
      const trimmedNote = text.trim();
      const all = loadHistory();
      const target = all.find((x) => x.id === entry.id);
      if (target) {
        if (trimmedNote) target.note = trimmedNote;
        else delete target.note;
        persistHistory(all);
        renderHistory();
      }
    });

    li.querySelector(".tape-share").addEventListener("click", (e) => {
      e.stopPropagation();
      shareAsImage({ expr: entry.expr, result: entry.result, note: entry.note, ts: entry.ts });
    });

    li.querySelector(".tape-whatsapp").addEventListener("click", (e) => {
      e.stopPropagation();
      shareViaWhatsApp({ expr: entry.expr, result: entry.result, note: entry.note, ts: entry.ts });
    });

    li.addEventListener("click", () => {
      if (selectionMode) { toggleSelect(entry.id); return; }
      state.current = entry.result.replace(/,/g, "");
      state.tokens = [];
      state.awaitingNewNumber = true;
      state.justEvaluated = false;
      state.frozenExpr = null;
      state.editingTokenIndex = null;
      state.caretPos = null;
      render();
      if (navigator.vibrate) { try { navigator.vibrate(10); } catch (e) {} }
      showToast(`${entry.result} loaded — aage calculate karo`);
      historyDrawer.close();
    });

    let pressTimer = null;
    li.addEventListener("pointerdown", () => {
      pressTimer = setTimeout(() => {
        if (!selectionMode) enterSelectionMode();
        toggleSelect(entry.id);
        if (navigator.vibrate) { try { navigator.vibrate(10); } catch (e) {} }
      }, 550);
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach((ev) =>
      li.addEventListener(ev, () => clearTimeout(pressTimer))
    );

    tapeList.appendChild(li);
  });
}

clearHistoryBtn.addEventListener("click", () => {
  if (confirm("Poori history clear karein? Ye undo nahi ho sakta.")) clearHistory();
});

function exportHistory() {
  const entries = loadHistory();
  if (!entries.length) { showToast("Export karne ke liye koi history nahi hai"); return; }
  let text = "Nova Calculator — History Export\nRV Group LTD | ♥️ BY PANKAJ\n" + new Date().toLocaleString() + "\n" + "=".repeat(36) + "\n\n";
  entries.slice().reverse().forEach((e) => {
    text += `${new Date(e.ts).toLocaleString()}\n${e.expr} = ${e.result}\n`;
    if (e.note) text += `Note: ${e.note}\n`;
    text += "\n";
  });
  const filename = `nova-calculator-history-${Date.now()}.txt`;
  if (window.AndroidBridge && typeof window.AndroidBridge.exportHistoryText === "function") {
    try {
      window.AndroidBridge.exportHistoryText(filename, text);
      showToast(`${entries.length} calculations exported`);
      safeSetItem(LAST_EXPORT_KEY, String(Date.now()));
      return;
    } catch (e) {}
  }
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast(`${entries.length} calculations exported`);
  safeSetItem(LAST_EXPORT_KEY, String(Date.now()));
  if (navigator.vibrate) { try { navigator.vibrate(10); } catch (e) {} }
}
exportHistoryBtn.addEventListener("click", exportHistory);
