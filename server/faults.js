import { SAMPLE_RECIPE } from './fixtures/sampleRecipe.js';

/**
 * Fault injection: `POST /api/recipe?simulate=<mode>` returns a deliberately
 * bad (or canned) response instead of calling the model. It exists so every
 * failure path in the client can be demonstrated and tested on demand.
 *
 * Enabled locally; on Vercel only when ENABLE_FAULTS=true.
 */
export function faultsEnabled() {
  return !process.env.VERCEL || process.env.ENABLE_FAULTS === 'true';
}

const clone = (v) => JSON.parse(JSON.stringify(v));

export const FAULTS = {
  // Happy path without an API key.
  sample: () => ({ status: 200, body: { recipe: SAMPLE_RECIPE, warnings: [], meta: { simulated: 'sample' } } }),

  // Random 0.5–3.5s delay. Submit twice quickly to see the stale-response guard:
  // only the LAST request's result is shown, even if an older one finishes later.
  race: (input) => {
    const recipe = clone(SAMPLE_RECIPE);
    recipe.title = `Sample for “${input.ingredients.slice(0, 40)}”`;
    return { delayMs: 500 + Math.random() * 3000, status: 200, body: { recipe, warnings: [], meta: { simulated: 'race' } } };
  },

  // Longer than the client's timeout.
  slow: () => ({ delayMs: 60000, status: 200, body: { recipe: SAMPLE_RECIPE, warnings: [] } }),

  // Truncated JSON with a JSON content type.
  malformed: () => ({ status: 200, raw: '{"recipe": {"title": "Broken recipe", "ingredients": [{"name": "eggs", "amou' }),

  // Valid JSON, wrong shape: no usable ingredients.
  wrongshape: () => ({
    status: 200,
    body: { recipe: { title: 42, ingredients: [{ qty: 2 }, { amount: 'lots' }], steps: ['Boil some water.'] } },
  }),

  // Messy but salvageable: string amounts, missing ids/servings, one broken item.
  partial: () => {
    const recipe = clone(SAMPLE_RECIPE);
    delete recipe.baseServings;
    recipe.ingredients[1].amount = '150 g';
    recipe.ingredients[1].unit = null;
    recipe.ingredients[3].amount = '1/2';
    delete recipe.ingredients[0].id;
    recipe.ingredients.push({ amount: 2, unit: 'cups' }); // no name -> dropped
    recipe.steps.push({ id: 'step-x', text: '   ' }); // empty -> dropped
    return { status: 200, body: { recipe, warnings: [] } };
  },

  empty: () => ({ status: 200, body: { recipe: {} } }),

  notfood: () => ({
    status: 422,
    body: { error: { code: 'NOT_FOOD', message: "That doesn't look like food. Try listing a few ingredients." } },
  }),

  error500: () => ({ status: 500, body: { error: { code: 'UPSTREAM', message: 'Simulated server error.' } } }),

  ratelimit: () => ({
    status: 429,
    body: { error: { code: 'RATE_LIMITED', message: 'Simulated rate limit. Wait a few seconds and try again.' } },
  }),
};
