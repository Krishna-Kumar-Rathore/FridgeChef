// Pure helpers for displaying a recipe. No React here, so they're easy to test.

const FRACTIONS = [
  [0, ''],
  [1 / 4, '¼'],
  [1 / 3, '⅓'],
  [1 / 2, '½'],
  [2 / 3, '⅔'],
  [3 / 4, '¾'],
  [1, ''],
];

/** 0.5 -> "½", 1.333 -> "1⅓", 2.4 -> "2.4", 237 -> "235", 0.03 -> "0.03", null -> "" */
export function formatAmount(n) {
  if (n == null || !Number.isFinite(n) || n <= 0) return '';
  if (n >= 100) return String(Math.round(n / 5) * 5);
  if (n >= 10) return String(Math.round(n));
  // Too small for a kitchen fraction; rounding would show "0".
  if (n < 0.1) return String(Number(n.toPrecision(1)));

  const whole = Math.floor(n);
  const frac = n - whole;
  for (const [value, glyph] of FRACTIONS) {
    if (Math.abs(frac - value) < 0.05) {
      const w = value === 1 ? whole + 1 : whole;
      if (!glyph) return String(w);
      return w ? `${w}${glyph}` : glyph;
    }
  }
  return String(Math.round(n * 10) / 10);
}

export function scaleAmount(amount, baseServings, servings) {
  if (amount == null) return null;
  return (amount * servings) / baseServings;
}

/** The ingredient as it should be shown, after any swap the user picked. */
export function effectiveIngredient(ingredient, swapIndex) {
  const swap = Number.isInteger(swapIndex) ? ingredient.swaps[swapIndex] : undefined;
  if (!swap) return { ...ingredient, swappedFrom: null, note: '' };
  // A swap with its own quantity uses it; one with only a unit ("to taste")
  // is not scalable; one with neither keeps the original quantity.
  let amount = ingredient.amount;
  let unit = ingredient.unit;
  if (swap.amount != null) {
    amount = swap.amount;
    unit = swap.unit;
  } else if (swap.unit) {
    amount = null;
    unit = swap.unit;
  }
  return { ...ingredient, name: swap.name, amount, unit, swappedFrom: ingredient.name, note: swap.note };
}

export function quantityLabel(amount, unit) {
  const a = formatAmount(amount);
  if (a && unit) return `${a} ${unit}`;
  return a || unit || '';
}

export function formatMinutes(min) {
  if (!min) return '';
  if (min < 60) return `${Math.round(min)} min`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function timeAgo(ts, now = Date.now()) {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}
