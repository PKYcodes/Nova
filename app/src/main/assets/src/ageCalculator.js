// ---------- Age / Date calculator ----------
import { ageBackdrop, ageDrawer, ageHandle, ageCloseBtn, ageFromDate, ageToDate, ageResult } from "./dom.js";
import { makeDrawerControls } from "./drawers.js";

const drawerControls = makeDrawerControls(ageDrawer, ageBackdrop, ageHandle);

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function diffDates(d1, d2) {
  if (d2 < d1) { const t = d1; d1 = d2; d2 = t; }
  let years = d2.getFullYear() - d1.getFullYear();
  let months = d2.getMonth() - d1.getMonth();
  let days = d2.getDate() - d1.getDate();
  if (days < 0) {
    months -= 1;
    const prevMonthLastDay = new Date(d2.getFullYear(), d2.getMonth(), 0).getDate();
    days += prevMonthLastDay;
  }
  if (months < 0) { years -= 1; months += 12; }
  const totalDays = Math.round((d2 - d1) / 86400000);
  return { years, months, days, totalDays };
}

function runAgeCalc() {
  if (!ageFromDate.value || !ageToDate.value) {
    ageResult.innerHTML = "Dono dates chuno";
    return;
  }
  const d1 = new Date(ageFromDate.value);
  const d2 = new Date(ageToDate.value);
  const { years, months, days, totalDays } = diffDates(d1, d2);
  const weeks = Math.floor(totalDays / 7);
  ageResult.innerHTML =
    `<span class="age-big">${years} Years, ${months} Months, ${days} Days</span>` +
    `Total: ${totalDays.toLocaleString()} din (${weeks.toLocaleString()} hafte)`;
}
ageFromDate.addEventListener("change", runAgeCalc);
ageToDate.addEventListener("change", runAgeCalc);
ageCloseBtn.addEventListener("click", drawerControls.close);

export function openAgeCalc() {
  if (!ageToDate.value) ageToDate.value = todayISO();
  runAgeCalc();
  drawerControls.open();
}
