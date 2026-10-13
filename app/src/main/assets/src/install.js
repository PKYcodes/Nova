// ---------- Install (Add to Home Screen) — lives inside the ⋮ menu ----------
import { installMenuItem, installMenuLabel } from "./dom.js";
import { INSTALLED_KEY, safeSetItem } from "./storage.js";
import { closeMenu } from "./menu.js";

let deferredPrompt = null;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

function isStandalone() {
  return Boolean(window.AndroidBridge) || (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true;
}
function markInstalled() {
  deferredPrompt = null;
  safeSetItem(INSTALLED_KEY, "yes");
  updateInstallMenuItem();
}
function updateInstallMenuItem() {
  if (isStandalone() || localStorage.getItem(INSTALLED_KEY) === "yes") {
    installMenuItem.disabled = true;
    installMenuLabel.textContent = "✓ App Installed";
  } else if (deferredPrompt) {
    installMenuItem.disabled = false;
    installMenuLabel.textContent = "Install App";
  } else if (isIOS) {
    installMenuItem.disabled = true;
    installMenuLabel.textContent = "Add via Share menu";
  } else {
    installMenuItem.disabled = true;
    installMenuLabel.textContent = "Install not available";
  }
}
updateInstallMenuItem();
// re-check whenever the tab regains focus — catches installs that happened without
// a reliable "appinstalled" event (common on iOS / some Android browsers)
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") updateInstallMenuItem(); });
window.addEventListener("focus", updateInstallMenuItem);
window.addEventListener("pageshow", updateInstallMenuItem);

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  updateInstallMenuItem();
});
installMenuItem.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  closeMenu();
  deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  if (choice && choice.outcome === "accepted") markInstalled();
  deferredPrompt = null;
  updateInstallMenuItem();
});
window.addEventListener("appinstalled", markInstalled);
