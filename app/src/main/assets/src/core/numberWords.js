// ---------- Number → words (no DOM) ----------
// 0-99 are irregular in Hindi, so this is a direct lookup rather than tens+ones concatenation.
const HINDI_0_99 = [
  "शून्य","एक","दो","तीन","चार","पांच","छह","सात","आठ","नौ",
  "दस","ग्यारह","बारह","तेरह","चौदह","पंद्रह","सोलह","सत्रह","अठारह","उन्नीस",
  "बीस","इक्कीस","बाईस","तेईस","चौबीस","पच्चीस","छब्बीस","सत्ताईस","अट्ठाईस","उनतीस",
  "तीस","इकतीस","बत्तीस","तैंतीस","चौंतीस","पैंतीस","छत्तीस","सैंतीस","अड़तीस","उनतालीस",
  "चालीस","इकतालीस","बयालीस","तैंतालीस","चौंतालीस","पैंतालीस","छियालीस","सैंतालीस","अड़तालीस","उनचास",
  "पचास","इक्यावन","बावन","तिरेपन","चौवन","पचपन","छप्पन","सत्तावन","अट्ठावन","उनसठ",
  "साठ","इकसठ","बासठ","तिरसठ","चौंसठ","पैंसठ","छियासठ","सड़सठ","अड़सठ","उनहत्तर",
  "सत्तर","इकहत्तर","बहत्तर","तिहत्तर","चौहत्तर","पचहत्तर","छिहत्तर","सतहत्तर","अठहत्तर","उनासी",
  "अस्सी","इक्यासी","बयासी","तिरासी","चौरासी","पचासी","छियासी","सत्तासी","अट्ठासी","नवासी",
  "नब्बे","इक्यानवे","बानवे","तिरानवे","चौरानवे","पंचानवे","छियानवे","सत्तानवे","अट्ठानवे","निन्यानवे",
];

const EN_ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const EN_TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigitWordsEn(n) {
  if (n < 20) return EN_ONES[n];
  return EN_TENS[Math.floor(n / 10)] + (n % 10 ? " " + EN_ONES[n % 10] : "");
}
function threeDigitWordsEn(n) {
  const h = Math.floor(n / 100), r = n % 100;
  let s = "";
  if (h) s += EN_ONES[h] + " Hundred";
  if (r) s += (s ? " " : "") + twoDigitWordsEn(r);
  return s;
}
function integerToWordsEn(num) {
  if (num === 0) return "Zero";
  let n = Math.floor(Math.abs(num));
  const crore = Math.floor(n / 10000000); n %= 10000000;
  const lakh = Math.floor(n / 100000); n %= 100000;
  const thousand = Math.floor(n / 1000); n %= 1000;
  const rest = n;
  const parts = [];
  if (crore) parts.push(threeDigitWordsEn(crore) + " Crore");
  if (lakh) parts.push(threeDigitWordsEn(lakh) + " Lakh");
  if (thousand) parts.push(threeDigitWordsEn(thousand) + " Thousand");
  if (rest) parts.push(threeDigitWordsEn(rest));
  return parts.join(" ") || "Zero";
}

function threeDigitWordsHindi(n) {
  const h = Math.floor(n / 100), r = n % 100;
  let s = "";
  if (h) s += HINDI_0_99[h] + " सौ";
  if (r) s += (s ? " " : "") + HINDI_0_99[r];
  return s;
}
// Indian numbering system: करोड़ / लाख / हज़ार
function integerToWordsHindi(num) {
  if (num === 0) return "शून्य";
  let n = Math.floor(Math.abs(num));
  const crore = Math.floor(n / 10000000); n %= 10000000;
  const lakh = Math.floor(n / 100000); n %= 100000;
  const thousand = Math.floor(n / 1000); n %= 1000;
  const rest = n;
  const parts = [];
  if (crore) parts.push(threeDigitWordsHindi(crore) + " करोड़");
  if (lakh) parts.push(threeDigitWordsHindi(lakh) + " लाख");
  if (thousand) parts.push(threeDigitWordsHindi(thousand) + " हज़ार");
  if (rest) parts.push(threeDigitWordsHindi(rest));
  return parts.join(" ") || "शून्य";
}

/**
 * @param {string} numStr  raw number string, e.g. "-1234.56"
 * @param {"hi"|"en"} lang
 */
export function numberToWordsFull(numStr, lang = "hi") {
  const neg = numStr.startsWith("-");
  const raw = neg ? numStr.slice(1) : numStr;
  const [intPartStr, decPartStr] = raw.split(".");
  const hindi = lang === "hi";
  let words = hindi
    ? integerToWordsHindi(parseInt(intPartStr || "0", 10))
    : integerToWordsEn(parseInt(intPartStr || "0", 10));
  if (decPartStr) {
    const decWords = hindi
      ? decPartStr.split("").map((d) => HINDI_0_99[parseInt(d, 10)] || "शून्य").join(" ")
      : decPartStr.split("").map((d) => EN_ONES[parseInt(d, 10)] || "Zero").join(" ");
    words += (hindi ? " दशमलव " : " Point ") + decWords;
  }
  return (neg ? (hindi ? "माइनस " : "Minus ") : "") + words;
}
