// ---------- Sound (Web Audio) + haptics ----------
import { soundMenuItem, soundMenuLabel, soundPackMenuItem, soundPackMenuLabel } from "./dom.js";
import { SOUND_KEY, SOUND_PACK_KEY, safeSetItem } from "./storage.js";
import { primeSpeech } from "./speech.js";

export let soundOn = localStorage.getItem(SOUND_KEY) !== "off";
export let soundPack = localStorage.getItem(SOUND_PACK_KEY) || "glass";

let audioCtx = null;
let masterGain = null;

export function ensureAudio() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) {
      audioCtx = new Ctx();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 2.0;
      masterGain.connect(audioCtx.destination);
    }
  }
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
  primeSpeech();
}

function blip({ freq = 700, duration = 0.07, type = "sine", gain = 0.05, detune = 5, filterStart = 5200, filterEnd = 900 }) {
  if (!soundOn || !audioCtx) return;
  const t0 = audioCtx.currentTime;
  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(filterStart, t0);
  filter.frequency.exponentialRampToValueAtTime(Math.max(filterEnd, 80), t0 + duration);
  osc1.type = type;
  osc2.type = type;
  osc1.frequency.value = freq;
  osc2.frequency.value = freq;
  osc2.detune.value = detune;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(g).connect(masterGain);
  osc1.start(t0); osc2.start(t0);
  osc1.stop(t0 + duration + 0.03);
  osc2.stop(t0 + duration + 0.03);
}

// Four distinct sound packs — waveform + pitch-spread + decay time are what give
// each its character: glass=soft sine, mechanical=tight square click,
// retro=chiptune square with big pitch jumps, chime=long triangle-wave bell.
const SOUND_PACK_PROFILES = {
  glass: { type: "sine", pitchStep: 22, durScale: 1.0 },
  mechanical: { type: "square", pitchStep: 6, durScale: 0.35 },
  retro: { type: "square", pitchStep: 45, durScale: 0.7 },
  chime: { type: "triangle", pitchStep: 18, durScale: 2.0 },
};
function packProfile() { return SOUND_PACK_PROFILES[soundPack] || SOUND_PACK_PROFILES.glass; }

export function sfxDigit(digit) {
  const p = packProfile();
  const n = digit && digit !== "." ? parseInt(digit, 10) : 5;
  const freq = 520 + (isNaN(n) ? 0 : n * p.pitchStep);
  blip({ freq, duration: 0.055 * p.durScale, type: p.type, gain: 0.095, filterStart: 4200, filterEnd: 1200 });
}
export function sfxOperator() {
  const p = packProfile();
  blip({ freq: 380, duration: 0.08 * p.durScale, type: p.type, gain: 0.1, filterStart: 3200, filterEnd: 700 });
}
export function sfxEquals() {
  const p = packProfile();
  blip({ freq: 420, duration: 0.08 * p.durScale, type: p.type, gain: 0.09 });
  setTimeout(() => blip({ freq: 560, duration: 0.08 * p.durScale, type: p.type, gain: 0.1 }), 70);
  setTimeout(() => blip({ freq: 760, duration: 0.14 * p.durScale, type: p.type, gain: 0.11, filterStart: 6000, filterEnd: 1800 }), 145);
}
export function sfxClear() {
  const p = packProfile();
  blip({ freq: 300, duration: 0.11 * p.durScale, type: p.type, gain: 0.085, filterStart: 2200, filterEnd: 400 });
}
export function sfxError() {
  blip({ freq: 180, duration: 0.22, type: "sawtooth", gain: 0.1, filterStart: 1400, filterEnd: 300 });
}

export function vibrate(ms) {
  if (window.AndroidBridge && typeof window.AndroidBridge.vibrate === "function") {
    try {
      window.AndroidBridge.vibrate(Array.isArray(ms) ? ms.join(",") : String(ms));
      return;
    } catch (e) {}
  }
  if (navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) {} }
}
export function vibrateForKey(btn) {
  if (btn.classList.contains("key-eq")) return vibrate([16, 24, 16]);
  if (btn.classList.contains("key-op")) return vibrate(12);
  if (btn.classList.contains("key-danger")) return vibrate([8, 16, 8]);
  if (btn.classList.contains("key-sci")) return vibrate(10);
  return vibrate(6); // digits and plain function keys — a lighter tap
}

function updateSoundLabel() {
  soundMenuLabel.textContent = "Sound: " + (soundOn ? "On" : "Off");
}
updateSoundLabel();
soundMenuItem.addEventListener("click", () => {
  ensureAudio();
  soundOn = !soundOn;
  safeSetItem(SOUND_KEY, soundOn ? "on" : "off");
  updateSoundLabel();
  if (soundOn) sfxDigit("5");
  vibrate(6);
});

const SOUND_PACK_ORDER = ["glass", "mechanical", "retro", "chime"];
const SOUND_PACK_LABELS = { glass: "Glass", mechanical: "Mechanical", retro: "Retro", chime: "Chime" };
function applySoundPackLabel() { soundPackMenuLabel.textContent = "Sound Pack: " + SOUND_PACK_LABELS[soundPack]; }
applySoundPackLabel();
soundPackMenuItem.addEventListener("click", () => {
  const idx = (SOUND_PACK_ORDER.indexOf(soundPack) + 1) % SOUND_PACK_ORDER.length;
  soundPack = SOUND_PACK_ORDER[idx];
  safeSetItem(SOUND_PACK_KEY, soundPack);
  applySoundPackLabel();
  ensureAudio();
  sfxDigit("5");
  vibrate(6);
});

if (typeof window !== 'undefined') { window.vibrate = vibrate; }
