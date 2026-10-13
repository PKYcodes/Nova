// ---------- Pure number formatting (no DOM) ----------

export function formatIndianInt(intPart) {
  if (intPart.length <= 3) return intPart;
  const last3 = intPart.slice(-3);
  const rest = intPart.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return rest + "," + last3;
}

/**
 * @param {string} numStr  raw number string, e.g. "1234.5" or "Error"
 * @param {"intl"|"indian"} format
 */
export function formatNumber(numStr, format = "intl") {
  if (numStr === "Error") return numStr;
  const neg = numStr.startsWith("-");
  let s = neg ? numStr.slice(1) : numStr;
  let [intPart, decPart] = s.split(".");
  intPart = format === "indian"
    ? formatIndianInt(intPart)
    : intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const out = intPart + (decPart !== undefined ? "." + decPart : "");
  return (neg ? "-" : "") + out;
}
