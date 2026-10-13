// ---------- 2.3s App Opening Splash Animation + Brand Pill ----------
import { showToast } from "./toast.js";

const splashScreen = document.getElementById("splashScreen");
const brandPill = document.getElementById("brandPill");

// Strict 2.0s reveal + 0.35s fade = 2.35s total (within 2-3s requirement)
const SPLASH_DURATION_MS = 2000;
let splashTimer = null;

function dismissSplash() {
  if (!splashScreen || splashScreen.classList.contains("splash-hide")) return;
  clearTimeout(splashTimer);
  splashScreen.classList.add("splash-hide");
}

if (splashScreen) {
  splashTimer = setTimeout(dismissSplash, SPLASH_DURATION_MS);
  // Allow instant tap-to-skip if the user taps early
  splashScreen.addEventListener("pointerdown", dismissSplash);
}

if (brandPill) {
  brandPill.addEventListener("click", () => {
    showToast("RV Group LTD | ♥️ BY PANKAJ", 1800);
  });
}
