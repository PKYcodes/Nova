// ---------- First-run welcome overlay ----------
import { onboardingOverlay, onboardingContinueBtn } from "./dom.js";
import { ONBOARDING_KEY, safeSetItem } from "./storage.js";

if (onboardingOverlay && !localStorage.getItem(ONBOARDING_KEY)) {
  onboardingOverlay.hidden = false;
}

onboardingContinueBtn?.addEventListener("click", () => {
  onboardingOverlay.hidden = true;
  safeSetItem(ONBOARDING_KEY, "1");
});
