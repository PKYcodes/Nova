// ---------- Nova Calculator — Entry Point ----------
import "./diagnostics.js";

import { hooks } from "./state.js";
import { render, updateMemoryBadge, pulseSuccess } from "./render.js";
import { saveHistory, renderHistory } from "./history.js";
import { onCalculationSuccess } from "./checkOverlay.js";
import { enableShareMenuItem } from "./menu.js";

import "./theme.js";
import "./audio.js";
import "./speech.js";
import "./settings.js";
import "./shareImage.js";
import "./shareModal.js";
import "./converter.js";
import "./ageCalculator.js";
import "./gstCalculator.js";
import "./emiCalculator.js";
import "./cashCalculator.js";
import "./updater.js";
import "./splash.js";
import "./onboarding.js";
import "./keypad.js";
import "./paste.js";

// Composition root: wire hooks
hooks.onHistorySave = saveHistory;
hooks.onSuccess = () => {
  onCalculationSuccess();
  enableShareMenuItem();
  pulseSuccess();
};
hooks.onMemoryChange = updateMemoryBadge;

// Initial paint
renderHistory();
render(false);
updateMemoryBadge();

// Service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

// Android hardware Back button handler: closes drawers first
window.__novaHandleBack = () => {
  const updateModal = document.getElementById("updateModal");
  if (updateModal && !updateModal.hidden) {
    updateModal.hidden = true;
    return true;
  }
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
  for (const id of ["drawer", "convDrawer", "ageDrawer", "shareDrawer", "gstDrawer", "emiDrawer", "cashDrawer"]) {
    const el = document.getElementById(id);
    if (el && el.classList.contains("open")) {
      el.classList.remove("open");
      const bd = document.getElementById(id.replace("Drawer", "Backdrop"));
      if (bd) bd.classList.remove("open");
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
