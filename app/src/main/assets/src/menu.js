// ---------- Options menu (⋮) ----------
import {
  menuBtn, menuDropdown, converterMenuItem, ageMenuItem,
  shareResultMenuItem, shareWhatsappMenuItem
} from "./dom.js";
import { state } from "./state.js";
import { openConverter } from "./converter.js";
import { openAgeCalc } from "./ageCalculator.js";
import { openGSTCalc } from "./gstCalculator.js";
import { openEMICalc } from "./emiCalculator.js";
import { openCashCalc } from "./cashCalculator.js";
import { openDiscountCalc } from "./discountCalculator.js";
import { openSplitCalc } from "./splitCalculator.js";
import { shareAsImage, shareViaWhatsApp } from "./shareImage.js";
import { openShareModal } from "./shareModal.js";
import { checkForAppUpdates } from "./updater.js";

const gstMenuItem = document.getElementById("gstMenuItem");
const emiMenuItem = document.getElementById("emiMenuItem");
const cashMenuItem = document.getElementById("cashMenuItem");
const discMenuItem = document.getElementById("discMenuItem");
const splitMenuItem = document.getElementById("splitMenuItem");

export function openMenu() { menuDropdown.hidden = false; }
export function closeMenu() { menuDropdown.hidden = true; }

menuBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  menuDropdown.hidden ? openMenu() : closeMenu();
});
document.addEventListener("click", (e) => {
  if (!menuDropdown.hidden && !e.target.closest(".menu-wrap")) closeMenu();
});

converterMenuItem.addEventListener("click", () => { closeMenu(); openConverter(); });
ageMenuItem.addEventListener("click", () => { closeMenu(); openAgeCalc(); });

if (gstMenuItem) gstMenuItem.addEventListener("click", () => { closeMenu(); openGSTCalc(); });
if (emiMenuItem) emiMenuItem.addEventListener("click", () => { closeMenu(); openEMICalc(); });
if (cashMenuItem) cashMenuItem.addEventListener("click", () => { closeMenu(); openCashCalc(); });
if (discMenuItem) discMenuItem.addEventListener("click", () => { closeMenu(); openDiscountCalc(); });
if (splitMenuItem) splitMenuItem.addEventListener("click", () => { closeMenu(); openSplitCalc(); });

shareResultMenuItem.addEventListener("click", () => {
  closeMenu();
  if (state.lastCalc) openShareModal(state.lastCalc);
});
shareWhatsappMenuItem.addEventListener("click", () => {
  closeMenu();
  if (state.lastCalc) shareViaWhatsApp(state.lastCalc);
});

export function enableShareMenuItem() {
  shareResultMenuItem.disabled = false;
  shareWhatsappMenuItem.disabled = false;
}
