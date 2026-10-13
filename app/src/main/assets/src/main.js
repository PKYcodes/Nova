// ---------- Nova Calculator — entry point ----------
import "./diagnostics.js"; // must be first, so it can catch errors from everything below too

import { hooks } from "./state.js";
import { render, updateMemoryBadge, pulseSuccess } from "./render.js";
import { saveHistory, renderHistory } from "./history.js";
import { onCalculationSuccess } from "./checkOverlay.js";
import { enableShareMenuItem } from "./menu.js";

// modules below wire up their own event listeners as a side effect of being
// imported (the same pattern the original single-file script used) — they're
// imported here so this file is the one place that shows everything that's active
import "./theme.js";
import "./audio.js";
import "./speech.js";
import "./settings.js";
import "./shareImage.js";
import "./converter.js";
import "./ageCalculator.js";
import "./install.js";
import "./splash.js";
import "./onboarding.js";
import "./keypad.js";
import "./paste.js";

// ---- composition root: wire state.js's cross-cutting hooks ----
hooks.onHistorySave = saveHistory;
hooks.onSuccess = () => {
  onCalculationSuccess();
  enableShareMenuItem();
  pulseSuccess();
};
hooks.onMemoryChange = updateMemoryBadge;

// ---- initial paint ----
renderHistory();
render(false);
updateMemoryBadge();

// ---- service worker ----
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}


// ---- Android hardware Back button handler ----
window.__novaHandleBack = () => {
  const splash = document.getElementById("splashScreen");
  if (splash && !splash.classList.contains("splash-hide")) {
    splash.classList.add("splash-hide");
    return true;
  }
  const onboard = document.getElementById("onboardingOverlay");
  if (onboard && !onboard.hidden) {
    onboard.hidden = true;
    return true;
  }
  const menu = document.getElementById("menuDropdown");
  if (menu && !menu.hidden) {
    menu.hidden = true;
    return true;
  }
  for (const id of ["drawer", "convDrawer", "ageDrawer"]) {
    const el = document.getElementById(id);
    if (el && el.classList.contains("open")) {
      el.classList.remove("open");
      const bd = el.previousElementSibling;
      if (bd && bd.classList.contains("drawer-backdrop")) bd.classList.remove("open");
      return true;
    }
  }
  const chk = document.getElementById("checkOverlay");
  if (chk && !chk.hidden) {
    chk.hidden = true;
    return true;
  }
  return false;
};
