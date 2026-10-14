// ---------- Speech (100% Reliable text-to-speech, Hindi & English) ----------
import { voiceMenuItem, voiceMenuLabel } from "./dom.js";
import { VOICE_LANG_KEY, safeSetItem } from "./storage.js";
import { showToast } from "./toast.js";
import { numberToWordsFull } from "./core/numberWords.js";
import { state } from "./state.js";

export let voiceLang = localStorage.getItem(VOICE_LANG_KEY) || "hi";

function applyVoiceLabel() {
  if (voiceMenuLabel) voiceMenuLabel.textContent = "Voice: " + (voiceLang === "hi" ? "Hindi" : "English");
}
applyVoiceLabel();

if (voiceMenuItem) {
  voiceMenuItem.addEventListener("click", () => {
    voiceLang = voiceLang === "hi" ? "en" : "hi";
    safeSetItem(VOICE_LANG_KEY, voiceLang);
    applyVoiceLabel();
    const previewMsg = voiceLang === "hi" ? "आवाज़ हिंदी सेट हो गई" : "Voice set to English";
    const fallbackMsg = "Voice set to " + (voiceLang === "hi" ? "Hindi" : "English");
    showToast(voiceLang === "hi" ? "आवाज़: हिंदी" : "Voice: English");
    speakNumber(previewMsg, true, fallbackMsg);
    if (window.vibrate) window.vibrate(6);
  });
}

let cachedVoices = [];
function loadVoices() {
  if (window.speechSynthesis) {
    cachedVoices = window.speechSynthesis.getVoices() || [];
  }
}
loadVoices();
if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

export function primeSpeech() {
  if (!window.speechSynthesis) return;
  try {
    if (window.speechSynthesis.paused) window.speechSynthesis.resume();
  } catch (e) {}
}

function pickVoiceFor(langPrefix) {
  if (!cachedVoices.length) loadVoices();
  const localMatch = cachedVoices.find(
    (v) => v.lang && v.lang.toLowerCase().startsWith(langPrefix) && v.localService === true
  );
  if (localMatch) return localMatch;
  return cachedVoices.find((v) => v.lang && v.lang.toLowerCase().startsWith(langPrefix)) || null;
}

/**
 * Speaks text in the active language with automatic Latin/English fallback
 * so devices without Hindi Devanagari TTS voices still speak aloud clearly.
 */
export function speakNumber(text, soundOn = true, customLatinFallback = "") {
  if (!soundOn || !text) return;

  let latinFallback = customLatinFallback;
  if (!latinFallback) {
    // Check if text contains Devanagari characters
    if (/[\u0900-\u097F]/.test(text)) {
      if (state.current && state.current !== "Error") {
        latinFallback = numberToWordsFull(state.current, "en");
      } else {
        latinFallback = text;
      }
    } else {
      latinFallback = text;
    }
  }

  // 1. Native Android APK Bridge (uses STREAM_MUSIC + automatic fallback if hi-IN missing)
  if (window.AndroidBridge) {
    try {
      if (typeof window.AndroidBridge.speakWithFallback === "function") {
        window.AndroidBridge.speakWithFallback(text, latinFallback, voiceLang);
        return;
      } else if (typeof window.AndroidBridge.speak === "function") {
        window.AndroidBridge.speak(text, voiceLang);
        return;
      }
    } catch (e) {}
  }

  // 2. Web Speech API fallback
  if (!window.speechSynthesis) return;
  try {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    window.speechSynthesis.cancel();

    let voice = pickVoiceFor(voiceLang);
    let langToUse = voiceLang === "hi" ? "hi-IN" : "en-IN";
    let textToUse = text;

    if (voiceLang === "hi" && !voice) {
      voice = pickVoiceFor("en");
      langToUse = "en-IN";
      textToUse = latinFallback;
    }

    const utter = new SpeechSynthesisUtterance(textToUse);
    if (voice) utter.voice = voice;
    utter.lang = langToUse;
    utter.rate = 1.0;
    utter.pitch = 1.0;
    window.speechSynthesis.resume();
    window.speechSynthesis.speak(utter);
  } catch (e) {}
}
