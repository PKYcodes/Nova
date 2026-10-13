// ---------- localStorage keys + a safe wrapper ----------
// Keep these keys STABLE across app updates — renaming one wipes everyone's saved data.
export const HISTORY_KEY = "nova-calc-history-v2";
export const SOUND_KEY = "nova-calc-sound";
export const THEME_KEY = "nova-calc-theme";
export const INSTALLED_KEY = "nova-calc-installed";
export const MEMORY_KEY = "nova-calc-memory";
export const SCI_KEY = "nova-calc-sci-mode";
export const FORMAT_KEY = "nova-calc-number-format";
export const VOICE_LANG_KEY = "nova-calc-voice-lang";
export const SOUND_PACK_KEY = "nova-calc-sound-pack";
export const LAST_EXPORT_KEY = "nova-calc-last-export";
export const LAST_BACKUP_NUDGE_KEY = "nova-calc-last-backup-nudge";
export const ONBOARDING_KEY = "nova-calc-onboarding-seen";

/** Wraps localStorage.setItem so a rare failure (private-mode quirks, quota, etc.)
 *  never throws out of a click handler and breaks that interaction. */
export function safeSetItem(key, value) {
  try { localStorage.setItem(key, value); } catch (e) {}
}
