// ---------- Pure calculator engine (no DOM) ----------
// Everything here takes plain data in, returns plain data out — that's what makes
// it independently testable with plain `node tests/engine.test.js`, no browser needed.

export const OPS = ["+", "−", "×", "÷"];
export const isOp = (t) => OPS.includes(t);

export function compute(a, op, b) {
  switch (op) {
    case "+": return a + b;
    case "−": return a - b;
    case "×": return a * b;
    case "÷": return b === 0 ? NaN : a / b;
    default: return b;
  }
}

export function trimNumber(n) {
  if (!isFinite(n)) return "Error";
  if (Number.isInteger(n)) return n.toString();
  return parseFloat(n.toFixed(10)).toString();
}

/**
 * Evaluates a flat token list [num, op, num, op, num, ...] with proper BODMAS
 * precedence: × and ÷ resolve first (left to right), then + and − (left to right).
 * Returns { error: true } on failure, or { error: false, result, steps } where
 * `steps` records each individual operation in the order it was actually
 * performed (BODMAS order) — this is what powers the CHECK feature and the
 * history step-by-step breakdown.
 */
export function evaluateExpression(toks) {
  const nums = [];
  const ops = [];
  toks.forEach((t, i) => (i % 2 === 0 ? nums.push(parseFloat(t)) : ops.push(t)));
  if (nums.some((n) => isNaN(n))) return { error: true };
  const steps = [];

  let i = 0;
  while (i < ops.length) {
    if (ops[i] === "×" || ops[i] === "÷") {
      const a = nums[i], b = nums[i + 1], op = ops[i];
      const r = compute(a, op, b);
      if (!isFinite(r)) return { error: true };
      steps.push({ a: trimNumber(a), op, b: trimNumber(b), result: trimNumber(r) });
      nums.splice(i, 2, r);
      ops.splice(i, 1);
    } else {
      i++;
    }
  }
  let result = nums[0];
  for (let j = 0; j < ops.length; j++) {
    const r = compute(result, ops[j], nums[j + 1]);
    if (!isFinite(r)) return { error: true };
    steps.push({ a: trimNumber(result), op: ops[j], b: trimNumber(nums[j + 1]), result: trimNumber(r) });
    result = r;
  }
  return { error: false, result: trimNumber(result), steps };
}
