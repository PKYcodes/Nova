// ---------- Theme switching ----------
import { themeMenuItem, themeMenuLabel } from "./dom.js";
import { THEME_KEY, safeSetItem } from "./storage.js";
import { showToast } from "./toast.js";

export const THEMES = ["nebula", "cyber", "sunset", "ocean"];
let themeIndex = Math.max(0, THEMES.indexOf(localStorage.getItem(THEME_KEY) || "nebula"));

function applyTheme(name) {
  if (name === "nebula") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", name);
}
function themeLabel(name) { return name.charAt(0).toUpperCase() + name.slice(1); }
function applyThemeMenuLabel() { themeMenuLabel.textContent = "Theme: " + themeLabel(THEMES[themeIndex]); }

applyTheme(THEMES[themeIndex]);
applyThemeMenuLabel();

themeMenuItem.addEventListener("click", () => {
  themeIndex = (themeIndex + 1) % THEMES.length;
  const name = THEMES[themeIndex];
  applyTheme(name);
  safeSetItem(THEME_KEY, name);
  applyThemeMenuLabel();
  showToast(themeLabel(name) + " theme");
  if (navigator.vibrate) { try { navigator.vibrate(6); } catch (e) {} }
});
