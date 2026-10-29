const UNICODE_FRACTIONS = { '¼': 0.25, '½': 0.5, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3, '⅛': 0.125 };

/**
 * Models often send amounts as strings: "2", "1/2", "1 1/2", "2-3", "½", "200g",
 * "a pinch". This turns them into { amount: number | null, unit: string | null }.
 * null amount means "not scalable" (to taste, a pinch, ...).
 */
export function parseAmount(raw) {
  if (typeof raw === 'number') {
    return { amount: Number.isFinite(raw) && raw > 0 ? raw : null, unit: null };
  }
  if (typeof raw !== 'string') return { amount: null, unit: null };

  let s = raw.trim().toLowerCase();
  if (!s) return { amount: null, unit: null };

  // "1½" -> "1 0.5", "½" -> "0.5"
  s = s.replace(/[¼½¾⅓⅔⅛]/g, (ch) => ` ${UNICODE_FRACTIONS[ch]}`).trim();

  // range "2-3" or "2 to 3" -> average
  const range = s.match(/^(\d+(?:\.\d+)?)\s*(?:-|–|to)\s*(\d+(?:\.\d+)?)\s*(.*)$/);
  if (range) {
    const avg = (parseFloat(range[1]) + parseFloat(range[2])) / 2;
    return { amount: avg, unit: range[3] || null };
  }

  // mixed number "1 1/2", fraction "1/2", whole/decimal "2" or "0.5", optional unit after
  const num = s.match(/^(\d+(?:\.\d+)?)?(?:\s*(\d+)\s*\/\s*(\d+))?(?:\s+(0?\.\d+))?\s*([a-z].*)?$/);
  if (num && (num[1] || num[2])) {
    let value = 0;
    if (num[1] && num[2]) {
      // "1 1/2"
      value = parseFloat(num[1]) + Number(num[2]) / Number(num[3]);
    } else if (num[2]) {
      value = Number(num[2]) / Number(num[3]);
    } else {
      value = parseFloat(num[1]);
    }
    if (num[4]) value += parseFloat(num[4]);
    if (Number.isFinite(value) && value > 0) {
      return { amount: value, unit: num[5]?.trim() || null };
    }
  }

  // "a pinch", "to taste", "some" -> not scalable; keep the words as the unit
  return { amount: null, unit: s };
}
