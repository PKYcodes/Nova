// ---------- Speech (double-tap the result to hear it, Hindi or English) ----------
import { voiceMenuItem, voiceMenuLabel } from "./dom.js";
import { VOICE_LANG_KEY, safeSetItem } from "./storage.js";
import { showToast } from "./toast.js";

export let voiceLang = localStorage.getItem(VOICE_LANG_KEY) || "hi";

function applyVoiceLabel() {
  voiceMenuLabel.textContent = "Voice: " + (voiceLang === "hi" ? "Hindi" : "English");
}
applyVoiceLabel();
voiceMenuItem.addEventListener("click", () => {
  voiceLang = voiceLang === "hi" ? "en" : "hi";
  safeSetItem(VOICE_LANG_KEY, voiceLang);
  applyVoiceLabel();
  showToast(voiceLang === "hi" ? "आवाज़: हिंदी" : "Voice: English");
  // navigator.vibrate is called directly (not imported from audio.js) to avoid a
  // circular dependency, since audio.js imports primeSpeech from this module.
  if (navigator.vibrate) { try { navigator.vibrate(6); } catch (e) {} }
});

// Speech engines are often slow (or silent) on the very first call while they warm up
// and load voices — priming with a near-silent utterance on the user's first tap fixes
// the 10-15s delay people hit the first time they use speech on a page.
let cachedVoices = [];
let speechPrimed = false;
function loadVoices() {
  if (window.speechSynthesis) cachedVoices = window.speechSynthesis.getVoices();
}
if (window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}
export function primeSpeech() {
  if (speechPrimed || !window.speechSynthesis) return;
  speechPrimed = true;
  try {
    const warm = new SpeechSynthesisUtterance(" ");
    warm.volume = 0;
    window.speechSynthesis.speak(warm);
  } catch (e) {}
}
function pickVoiceFor(langPrefix) {
  if (!cachedVoices.length) loadVoices();
  return cachedVoices.find((v) => v.lang && v.lang.toLowerCase().startsWith(langPrefix)) || null;
}

/** soundOn is passed in (rather than imported) to avoid a circular dependency with audio.js */
export function speakNumber(text, soundOn) {
  if (!soundOn) return;
  if (window.AndroidBridge && typeof window.AndroidBridge.speak === "function") {
    try {
      window.AndroidBridge.speak(text, voiceLang);
      return;
    } catch (e) {}
  }
  if (!window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const langCode = voiceLang === "hi" ? "hi-IN" : "en-IN";
    const voice = pickVoiceFor(voiceLang === "hi" ? "hi" : "en");
    if (voice) utter.voice = voice;
    utter.lang = langCode;
    utter.rate = 0.95;
    utter.pitch = 1;
    window.speechSynthesis.resume();
    window.speechSynthesis.speak(utter);
  } catch (e) {}
}
