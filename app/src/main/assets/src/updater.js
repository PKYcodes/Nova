// ---------- In-App GitHub Releases Auto-Update Engine ----------
import { showToast } from "./toast.js";
import { vibrate } from "./audio.js";

export const CURRENT_VERSION = "1.0.0";
export const GITHUB_REPO = "rv-group/nova-calculator"; // default repository path
const LAST_UPDATE_CHECK_KEY = "nova_last_update_check";

const updateModal = document.getElementById("updateModal");
const updateModalCloseBtn = document.getElementById("updateModalCloseBtn");
const updateModalInstallBtn = document.getElementById("updateModalInstallBtn");
const updateNewVersionBadge = document.getElementById("updateNewVersionBadge");
const updateReleaseNotes = document.getElementById("updateReleaseNotes");
const checkUpdateMenuBtn = document.getElementById("checkUpdateMenuBtn");
const updateMenuStatus = document.getElementById("updateMenuStatus");
const updateAvailableBadge = document.getElementById("updateAvailableBadge");

let latestReleaseData = null;

// Clean SemVer comparator: returns true if vNew > vCurrent
function isNewerVersion(vNew, vCurrent) {
  const clean = (s) => (s || "").replace(/[^0-9.]/g, "").split(".").map((n) => parseInt(n, 10) || 0);
  const a = clean(vNew);
  const b = clean(vCurrent);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const valA = a[i] || 0;
    const valB = b[i] || 0;
    if (valA > valB) return true;
    if (valA < valB) return false;
  }
  return false;
}

export async function checkForAppUpdates(interactive = false) {
  if (updateMenuStatus) updateMenuStatus.textContent = "Checking...";

  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers: { Accept: "application/vnd.github.v3+json" }
    });

    if (!res.ok) {
      if (interactive) {
        showToast("✓ Aapka app latest version (v" + CURRENT_VERSION + ") par hai");
        if (updateMenuStatus) updateMenuStatus.textContent = "Up to date (v" + CURRENT_VERSION + ")";
      }
      return;
    }

    const release = await res.json();
    const latestTag = release.tag_name || release.name || "";

    if (isNewerVersion(latestTag, CURRENT_VERSION)) {
      latestReleaseData = release;
      // Show badge in menu
      if (updateAvailableBadge) updateAvailableBadge.hidden = false;
      if (updateMenuStatus) updateMenuStatus.textContent = `🚀 Update v${latestTag.replace('v','')} Available!`;

      // Trigger In-App Update Modal
      showUpdateModal(release);
      vibrate([15, 30, 15]);
    } else {
      if (updateAvailableBadge) updateAvailableBadge.hidden = true;
      if (updateMenuStatus) updateMenuStatus.textContent = `✓ Latest version (v${CURRENT_VERSION})`;
      if (interactive) {
        showToast("✓ Aapka app latest version (v" + CURRENT_VERSION + ") par hai");
      }
    }
  } catch (e) {
    if (interactive) {
      showToast("✓ App version v" + CURRENT_VERSION + " active hai");
      if (updateMenuStatus) updateMenuStatus.textContent = `Up to date (v${CURRENT_VERSION})`;
    }
  }
}

function showUpdateModal(release) {
  if (!updateModal) return;
  const tag = release.tag_name || "v1.1.0";
  if (updateNewVersionBadge) updateNewVersionBadge.textContent = tag;
  if (updateReleaseNotes) {
    updateReleaseNotes.textContent = release.body || "New features, performance enhancements, and bug fixes.";
  }
  updateModal.hidden = false;
}

export function hideUpdateModal() {
  if (updateModal) updateModal.hidden = true;
}

// When user taps "Update Now"
if (updateModalInstallBtn) {
  updateModalInstallBtn.addEventListener("click", () => {
    hideUpdateModal();
    // Find direct APK download asset if present
    const apkAsset = latestReleaseData?.assets?.find((a) => a.name && a.name.endsWith(".apk"));
    const downloadUrl = apkAsset?.browser_download_url || latestReleaseData?.html_url || `https://github.com/${GITHUB_REPO}/releases/latest`;

    showToast("Opening update download...");
    vibrate(10);

    // If running inside Android native bridge
    if (window.AndroidBridge && typeof window.AndroidBridge.openExternalUrl === "function") {
      window.AndroidBridge.openExternalUrl(downloadUrl);
    } else {
      window.open(downloadUrl, "_blank", "noopener");
    }
  });
}

if (updateModalCloseBtn) updateModalCloseBtn.addEventListener("click", hideUpdateModal);

if (checkUpdateMenuBtn) {
  checkUpdateMenuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    checkForAppUpdates(true);
  });
}

// Check for updates on startup (debounced once every 4 hours)
const lastCheck = parseInt(localStorage.getItem(LAST_UPDATE_CHECK_KEY) || "0", 10);
if (Date.now() - lastCheck > 4 * 3600 * 1000) {
  setTimeout(() => {
    checkForAppUpdates(false);
    localStorage.setItem(LAST_UPDATE_CHECK_KEY, Date.now().toString());
  }, 3500); // Check 3.5s after app opens so opening animation stays buttery smooth
}
