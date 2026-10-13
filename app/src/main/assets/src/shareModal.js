// ---------- Dedicated Share Modal with Direct Social Channels ----------
import { shareAsImage, generateShareCardDataUrl } from "./shareImage.js";
import { showToast } from "./toast.js";
import { vibrate } from "./audio.js";

const shareDrawer = document.getElementById("shareDrawer");
const shareBackdrop = document.getElementById("shareBackdrop");
const shareCloseBtn = document.getElementById("shareCloseBtn");
const shareExprPreview = document.getElementById("shareExprPreview");
const shareResultPreview = document.getElementById("shareResultPreview");

let activeCalc = null;

export function openShareModal(calc) {
  if (!calc || !calc.expr || calc.result === undefined) {
    showToast("Share karne ke liye pehle koi calculation karo");
    return;
  }
  activeCalc = calc;
  if (shareExprPreview) shareExprPreview.textContent = calc.expr;
  if (shareResultPreview) shareResultPreview.textContent = "= " + calc.result;

  if (shareDrawer) shareDrawer.classList.add("open");
  if (shareBackdrop) shareBackdrop.classList.add("open");
  vibrate(6);
}

export function closeShareModal() {
  if (shareDrawer) shareDrawer.classList.remove("open");
  if (shareBackdrop) shareBackdrop.classList.remove("open");
}

if (shareCloseBtn) shareCloseBtn.addEventListener("click", closeShareModal);
if (shareBackdrop) shareBackdrop.addEventListener("click", closeShareModal);

function getShareText(calc) {
  let text = `🧮 Nova Calculator\n${calc.expr} = ${calc.result}`;
  if (calc.note) text += `\n🏷 ${calc.note}`;
  text += `\nRV Group LTD | ♥️ BY PANKAJ`;
  return text;
}

// Wire direct platform buttons
const platformActions = {
  whatsapp: (calc) => {
    const text = getShareText(calc);
    if (window.AndroidBridge && typeof window.AndroidBridge.shareWhatsApp === "function") {
      const dataUrl = generateShareCardDataUrl(calc);
      window.AndroidBridge.shareWhatsApp(dataUrl, text);
    } else {
      window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank", "noopener");
    }
  },
  telegram: (calc) => {
    const text = getShareText(calc);
    if (window.AndroidBridge && typeof window.AndroidBridge.shareToPlatform === "function") {
      const dataUrl = generateShareCardDataUrl(calc);
      window.AndroidBridge.shareToPlatform("telegram", dataUrl, text);
    } else {
      window.open("https://t.me/share/url?url=&text=" + encodeURIComponent(text), "_blank", "noopener");
    }
  },
  twitter: (calc) => {
    const text = getShareText(calc);
    if (window.AndroidBridge && typeof window.AndroidBridge.shareToPlatform === "function") {
      const dataUrl = generateShareCardDataUrl(calc);
      window.AndroidBridge.shareToPlatform("twitter", dataUrl, text);
    } else {
      window.open("https://twitter.com/intent/tweet?text=" + encodeURIComponent(text), "_blank", "noopener");
    }
  },
  facebook: (calc) => {
    const text = getShareText(calc);
    if (window.AndroidBridge && typeof window.AndroidBridge.shareToPlatform === "function") {
      const dataUrl = generateShareCardDataUrl(calc);
      window.AndroidBridge.shareToPlatform("facebook", dataUrl, text);
    } else {
      window.open("https://www.facebook.com/sharer/sharer.php?quote=" + encodeURIComponent(text), "_blank", "noopener");
    }
  },
  sms: (calc) => {
    const text = getShareText(calc);
    if (window.AndroidBridge && typeof window.AndroidBridge.shareToPlatform === "function") {
      window.AndroidBridge.shareToPlatform("sms", "", text);
    } else {
      window.open("sms:?body=" + encodeURIComponent(text), "_self");
    }
  },
  system: (calc) => {
    shareAsImage(calc);
  },
  copy: (calc) => {
    const text = `${calc.expr} = ${calc.result}${calc.note ? " (" + calc.note + ")" : ""} — RV Group LTD | ♥️ BY PANKAJ`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        showToast("Text copied");
        vibrate(8);
      }).catch(() => {});
    }
  }
};

document.querySelectorAll("[data-share-channel]").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (!activeCalc) return;
    const channel = btn.dataset.shareChannel;
    if (platformActions[channel]) {
      platformActions[channel](activeCalc);
      closeShareModal();
    }
  });
});
