// ---------- Speech (Instant text-to-speech, Hindi & English) ----------
import { voiceMenuItem, voiceMenuLabel } from "./dom.js";
import { VOICE_LANG_KEY, safeSetItem } from "./storage.js";
import { showToast } from "./toast.js";

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
    showToast(voiceLang === "hi" ? "आवाज़: हिंदी" : "Voice: English");
    if (navigator.vibrate) { try { navigator.vibrate(6); } catch (e) {} }
  });
}

// Eagerly pre-load and cache speech voices immediately
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

// Warm up speech synthesis immediately on first interaction
let speechPrimed = false;
export function primeSpeech() {
  if (speechPrimed || !window.speechSynthesis) return;
  speechPrimed = true;
  try {
    const warm = new SpeechSynthesisUtterance("");
    warm.volume = 0;
    warm.rate = 2.0;
    window.speechSynthesis.speak(warm);
  } catch (e) {}
}

function pickVoiceFor(langPrefix) {
  if (!cachedVoices.length) loadVoices();
  // 1. Prefer local/offline voices first (they speak in <20ms without network roundtrip)
  const localMatch = cachedVoices.find(
    (v) => v.lang && v.lang.toLowerCase().startsWith(langPrefix) && v.localService === true
  );
  if (localMatch) return localMatch;

  // 2. Fallback to any matching voice
  return cachedVoices.find((v) => v.lang && v.lang.toLowerCase().startsWith(langPrefix)) || null;
}

export function speakNumber(text, soundOn = true) {
  if (!soundOn || !text) return;

  // 1. Native Android APK Bridge: zero latency, pre-warmed native TTS
  if (window.AndroidBridge && typeof window.AndroidBridge.speak === "function") {
    try {
      window.AndroidBridge.speak(text, voiceLang);
      return;
    } catch (e) {}
  }

  // 2. Web Speech API fallback: instant execution
  if (!window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const langCode = voiceLang === "hi" ? "hi-IN" : "en-IN";
    const voice = pickVoiceFor(voiceLang === "hi" ? "hi" : "en");
    if (voice) utter.voice = voice;
    utter.lang = langCode;
    utter.rate = 1.05; // snappy natural rate
    utter.pitch = 1.0;
    window.speechSynthesis.resume();
    window.speechSynthesis.speak(utter);
  } catch (e) {}
}
