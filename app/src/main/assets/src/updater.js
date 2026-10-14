// ---------- In-App GitHub Releases Auto-Update Engine (v2.0.0) ----------
import { showToast } from "./toast.js";
import { vibrate } from "./audio.js";

export const CURRENT_VERSION = "2.1.0";
export const githubRepo = "Pkycodes/Nova";
const LAST_UPDATE_CHECK_KEY = "nova_last_update_check";

const updateModal = document.getElementById("updateModal");
const updateModalCloseBtn = document.getElementById("updateModalCloseBtn");
const updateModalInstallBtn = document.getElementById("updateModalInstallBtn");
const updateNewVersionBadge = document.getElementById("updateNewVersionBadge");
const updateReleaseNotes = document.getElementById("updateReleaseNotes");
const updateModalTitle = document.getElementById("updateModalTitle");
const updateModalSub = document.getElementById("updateModalSub");
const checkUpdateMenuBtn = document.getElementById("checkUpdateMenuBtn");
const updateMenuStatus = document.getElementById("updateMenuStatus");
const updateAvailableBadge = document.getElementById("updateAvailableBadge");

let latestReleaseData = null;

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
  if (interactive) vibrate(6);

  try {
    let res = await fetch(`https://api.github.com/repos/${githubRepo}/releases/latest`, {
      headers: { Accept: "application/vnd.github.v3+json" }
    });
    let release = null;
    if (res.ok) {
      release = await res.json();
    } else {
      const listRes = await fetch(`https://api.github.com/repos/${githubRepo}/releases`, {
        headers: { Accept: "application/vnd.github.v3+json" }
      });
      if (listRes.ok) {
        const list = await listRes.json();
        if (Array.isArray(list) && list.length > 0) release = list[0];
      }
    }

    if (!release) {
      if (updateMenuStatus) updateMenuStatus.textContent = `v${CURRENT_VERSION} (Latest)`;
      if (interactive) {
        showUpToDateModal();
      }
      return;
    }

    const latestTag = release.tag_name || release.name || "";

    if (isNewerVersion(latestTag, CURRENT_VERSION)) {
      latestReleaseData = release;
      if (updateAvailableBadge) updateAvailableBadge.hidden = false;
      if (updateMenuStatus) updateMenuStatus.textContent = `🚀 Update ${latestTag}`;
      showUpdateModal(release, true);
      vibrate([15, 30, 15]);
    } else {
      latestReleaseData = release;
      if (updateAvailableBadge) updateAvailableBadge.hidden = true;
      if (updateMenuStatus) updateMenuStatus.textContent = `v${CURRENT_VERSION} (Latest)`;
      if (interactive) {
        showUpToDateModal(release);
      }
    }
  } catch (e) {
    if (updateMenuStatus) updateMenuStatus.textContent = `v${CURRENT_VERSION} (Latest)`;
    if (interactive) {
      showUpToDateModal();
    }
  }
}

function showUpdateModal(release, hasNewUpdate = true) {
  if (!updateModal) return;
  const tag = release?.tag_name || `v${CURRENT_VERSION}`;
  if (updateModalTitle) {
    updateModalTitle.textContent = hasNewUpdate ? "🚀 New Update Available!" : "✓ App is Up to Date";
  }
  if (updateModalSub) {
    updateModalSub.textContent = hasNewUpdate
      ? "Naya version download aur install karne ke liye tayyar hai"
      : `Aap Nova Calculator ke latest version (v${CURRENT_VERSION}) par hain`;
  }
  if (updateNewVersionBadge) updateNewVersionBadge.textContent = tag;
  if (updateReleaseNotes) {
    updateReleaseNotes.textContent = release?.body ||
      "v2.1.0: Added Discount & Margin Calculator, Bill Splitter, 12-Key Scientific Mode, Area & Data Converter, ₹5/₹2/₹1 Cash Tally, and 100% Media-Stream Voice Engine.";
  }
  if (updateModalInstallBtn) {
    updateModalInstallBtn.textContent = hasNewUpdate ? "Update Now ⬇" : "View GitHub Releases ↗";
  }
  updateModal.hidden = false;
}

function showUpToDateModal(release = null) {
  showUpdateModal(release, false);
}

export function hideUpdateModal() {
  if (updateModal) updateModal.hidden = true;
}

if (updateModalInstallBtn) {
  updateModalInstallBtn.addEventListener("click", () => {
    hideUpdateModal();
    const apkAsset = latestReleaseData?.assets?.find((a) => a.name && a.name.endsWith(".apk"));
    const downloadUrl = apkAsset?.browser_download_url || latestReleaseData?.html_url || `https://github.com/${githubRepo}/releases/latest`;

    showToast("Opening GitHub Release...");
    vibrate(10);

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

const lastCheck = parseInt(localStorage.getItem(LAST_UPDATE_CHECK_KEY) || "0", 10);
if (Date.now() - lastCheck > 4 * 3600 * 1000) {
  setTimeout(() => {
    checkForAppUpdates(false);
    localStorage.setItem(LAST_UPDATE_CHECK_KEY, Date.now().toString());
  }, 3500);
}
