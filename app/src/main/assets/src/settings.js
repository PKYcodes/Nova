// ---------- Shared settings used by multiple modules (state, render, history) ----------
import { sciWrap, sciMenuItem, sciMenuLabel, formatMenuItem, formatMenuLabel } from "./dom.js";
import { SCI_KEY, FORMAT_KEY, safeSetItem } from "./storage.js";

export let numberFormat = localStorage.getItem(FORMAT_KEY) || "intl";
export let sciMode = localStorage.getItem(SCI_KEY) === "on";

/** Set by main.js once render.js and history.js are both available, so toggling the
 *  format immediately refreshes what's on screen without this module depending on them. */
export const onFormatChange = { fn: null };

function applySciMode() {
  sciWrap.classList.toggle("expanded", sciMode);
  sciMenuLabel.textContent = "Scientific: " + (sciMode ? "On" : "Off");
}
applySciMode();
sciMenuItem.addEventListener("click", () => {
  sciMode = !sciMode;
  safeSetItem(SCI_KEY, sciMode ? "on" : "off");
  applySciMode();
  if (navigator.vibrate) { try { navigator.vibrate(6); } catch (e) {} }
});

function applyFormatLabel() {
  formatMenuLabel.textContent = "Format: " + (numberFormat === "indian" ? "Indian (Lakh/Crore)" : "International");
}
applyFormatLabel();
formatMenuItem.addEventListener("click", () => {
  numberFormat = numberFormat === "indian" ? "intl" : "indian";
  safeSetItem(FORMAT_KEY, numberFormat);
  applyFormatLabel();
  onFormatChange.fn?.();
  if (navigator.vibrate) { try { navigator.vibrate(6); } catch (e) {} }
});
