import { parseAmount } from './amount.js';
import { recipeSchema, formatIssues } from './recipeSchema.js';

/**
 * The single entry point for "is this model output usable?".
 * Used by the server (before retrying) AND the client (never trust the network).
 *
 * Steps:
 *  1. Detect the explicit NOT_FOOD answer.
 *  2. normalize(): leniently clean what we can (coerce numbers, generate ids,
 *     drop broken items) and record a warning for every fix.
 *  3. Strictly validate the cleaned result with Zod.
 *
 * Returns one of:
 *   { ok: true, recipe, warnings }
 *   { ok: false, code: 'NOT_FOOD', message }
 *   { ok: false, code: 'EMPTY', problems }
 *   { ok: false, code: 'BAD_OUTPUT', problems }
 */
export function validateRecipe(raw) {
  if (raw == null || (typeof raw === 'object' && !Array.isArray(raw) && Object.keys(raw).length === 0)) {
    return { ok: false, code: 'EMPTY', problems: ['The model returned an empty object.'] };
  }
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, code: 'BAD_OUTPUT', problems: ['Expected a JSON object at the top level.'] };
  }
  if (raw.error === 'NOT_FOOD' || raw.error?.code === 'NOT_FOOD') {
    const message = typeof raw.message === 'string' ? raw.message : "That doesn't look like a list of ingredients.";
    return { ok: false, code: 'NOT_FOOD', message };
  }

  // Some models wrap the result: { "recipe": {...} }
  const source = raw.recipe && typeof raw.recipe === 'object' ? raw.recipe : raw;

  const { recipe, warnings } = normalize(source);
  if (recipe.ingredients.length === 0 && recipe.steps.length === 0) {
    return { ok: false, code: 'EMPTY', problems: ['The recipe had no ingredients and no steps.'] };
  }
  const result = recipeSchema.safeParse(recipe);
  if (!result.success) {
    return { ok: false, code: 'BAD_OUTPUT', problems: formatIssues(result.error) };
  }
  return { ok: true, recipe: result.data, warnings };
}

const asText = (v) => (typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '');
const asPositiveNumber = (v) => {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : null;
};

export function normalize(src) {
  const warnings = Array.isArray(src.warnings) ? src.warnings.filter((w) => typeof w === 'string' && w.trim()) : [];

  // --- servings -----------------------------------------------------------
  let baseServings = Math.round(asPositiveNumber(src.baseServings ?? src.servings) ?? 0);
  if (baseServings < 1 || baseServings > 50) {
    baseServings = 2;
    warnings.push("The recipe didn't say how many it serves, so we assumed 2.");
  }

  // --- ingredients --------------------------------------------------------
  const rawIngredients = Array.isArray(src.ingredients) ? src.ingredients : [];
  const usedIds = new Set();
  const uniqueId = (candidate, prefix, index) => {
    let id = asText(candidate) || `${prefix}-${index + 1}`;
    while (usedIds.has(id)) id = `${id}-x`;
    usedIds.add(id);
    return id;
  };

  const ingredients = [];
  let droppedIngredients = 0;
  rawIngredients.forEach((item, index) => {
    // Accept plain strings too: ["2 eggs", "spinach"]
    const obj = typeof item === 'string' ? { name: item } : item;
    const name = obj && typeof obj === 'object' ? asText(obj.name ?? obj.ingredient) : '';
    if (!name) {
      droppedIngredients += 1;
      return;
    }
    const parsed = parseAmount(obj.amount ?? obj.quantity);
    const unit = asText(obj.unit) || parsed.unit;
    const swaps = (Array.isArray(obj.swaps) ? obj.swaps : [])
      .map((s) => (typeof s === 'string' ? { name: s } : s))
      .filter((s) => s && typeof s === 'object' && asText(s.name))
      .slice(0, 3)
      .map((s) => {
        const sp = parseAmount(s.amount);
        return { name: asText(s.name), amount: sp.amount, unit: asText(s.unit) || sp.unit, note: asText(s.note) };
      });

    ingredients.push({
      id: uniqueId(obj.id, 'ing', index),
      name,
      amount: parsed.amount,
      unit: unit || null,
      fromFridge: obj.fromFridge !== false,
      swaps,
    });
  });
  if (droppedIngredients) {
    warnings.push(`Skipped ${droppedIngredients} ingredient${droppedIngredients > 1 ? 's' : ''} the AI didn't describe properly.`);
  }

  // --- steps --------------------------------------------------------------
  const knownIngredientIds = new Set(ingredients.map((i) => i.id));
  const rawSteps = Array.isArray(src.steps) ? src.steps : Array.isArray(src.instructions) ? src.instructions : [];
  usedIds.clear();
  ingredients.forEach((i) => usedIds.add(i.id));

  const steps = [];
  let droppedSteps = 0;
  rawSteps.forEach((item, index) => {
    const obj = typeof item === 'string' ? { text: item } : item;
    const text = obj && typeof obj === 'object' ? asText(obj.text ?? obj.instruction ?? obj.description) : '';
    if (!text) {
      droppedSteps += 1;
      return;
    }
    const ingredientIds = (Array.isArray(obj.ingredientIds) ? obj.ingredientIds : []).filter((id) =>
      knownIngredientIds.has(id),
    );
    steps.push({
      id: uniqueId(obj.id, 'step', index),
      text,
      minutes: asPositiveNumber(obj.minutes),
      ingredientIds: [...new Set(ingredientIds)],
    });
  });
  if (droppedSteps) {
    warnings.push(`Skipped ${droppedSteps} step${droppedSteps > 1 ? 's' : ''} with no instructions.`);
  }

  // --- header -------------------------------------------------------------
  let title = asText(src.title ?? src.name);
  if (!title) {
    title = 'Fridge recipe';
    if (ingredients.length) warnings.push("The recipe came without a name, so we gave it one.");
  }

  return {
    recipe: {
      title,
      description: asText(src.description),
      baseServings,
      prepMinutes: asPositiveNumber(src.prepMinutes),
      cookMinutes: asPositiveNumber(src.cookMinutes),
      ingredients,
      steps,
    },
    warnings,
  };
}
