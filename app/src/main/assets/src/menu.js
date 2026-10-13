// ---------- Options menu (⋮) ----------
import { menuBtn, menuDropdown, converterMenuItem, ageMenuItem, shareResultMenuItem, shareWhatsappMenuItem } from "./dom.js";
import { state } from "./state.js";
import { openConverter } from "./converter.js";
import { openAgeCalc } from "./ageCalculator.js";
import { shareAsImage, shareViaWhatsApp } from "./shareImage.js";

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
shareResultMenuItem.addEventListener("click", () => {
  closeMenu();
  if (state.lastCalc) shareAsImage(state.lastCalc);
});
shareWhatsappMenuItem.addEventListener("click", () => {
  closeMenu();
  if (state.lastCalc) shareViaWhatsApp(state.lastCalc);
});

/** Called by state.js's onSuccess hook after every successful "=" */
export function enableShareMenuItem() {
  shareResultMenuItem.disabled = false;
  shareWhatsappMenuItem.disabled = false;
}
