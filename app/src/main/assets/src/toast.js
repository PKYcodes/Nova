// ---------- Toast ----------
import { toast } from "./dom.js";

let toastTimer = null;
export function showToast(msg, duration = 1400) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), duration);
}
