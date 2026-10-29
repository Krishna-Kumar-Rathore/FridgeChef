import { generateRecipe } from './generateRecipe.js';
import { AppError, errorBody } from './errors.js';
import { FAULTS, faultsEnabled } from './faults.js';

const MAX_INPUT_CHARS = 1000;
const ALLOWED_DIETS = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free'];

/**
 * POST /api/recipe  body: { ingredients: string, servings?: number, diet?: string[] }
 *
 * The same function runs as a Vercel serverless function (api/recipe.js) and
 * inside the local Express server (server/dev.js). Both give it a Node
 * req/res with `req.body` parsed and `res.status().json()` available.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST.' } });
  }

  // If the browser cancels (new request, Cancel button, closed tab), stop
  // waiting on the model too, so we don't burn free-tier quota.
  const controller = new AbortController();
  res.on('close', () => {
    if (!res.writableEnded) controller.abort();
  });

  try {
    const input = validateInput(req.body);

    const mode = req.query?.simulate;
    if (mode) {
      if (!faultsEnabled() || !FAULTS[mode]) throw new AppError('INVALID_INPUT', `Unknown simulate mode "${mode}".`);
      return await sendFault(res, FAULTS[mode](input), controller.signal);
    }

    const result = await generateRecipe(input, { signal: controller.signal });
    return res.status(200).json(result);
  } catch (err) {
    if (controller.signal.aborted) return; // client is gone; nothing to send
    const appErr = err instanceof AppError ? err : new AppError('UPSTREAM', 'Something went wrong on the server.');
    if (!(err instanceof AppError)) console.error('[recipe] unexpected error', err);
    return res.status(appErr.status).json(errorBody(appErr));
  }
}

function validateInput(body) {
  const data = body && typeof body === 'object' ? body : {};
  const ingredients = typeof data.ingredients === 'string' ? data.ingredients.trim() : '';
  if (ingredients.length < 2) throw new AppError('INVALID_INPUT', 'Please list at least one ingredient.');
  if (ingredients.length > MAX_INPUT_CHARS) {
    throw new AppError('INVALID_INPUT', `Please keep the list under ${MAX_INPUT_CHARS} characters.`);
  }
  const servings = Number.isInteger(data.servings) && data.servings >= 1 && data.servings <= 12 ? data.servings : 2;
  const diet = Array.isArray(data.diet) ? data.diet.filter((d) => ALLOWED_DIETS.includes(d)) : [];
  return { ingredients, servings, diet };
}

async function sendFault(res, fault, signal) {
  if (fault.delayMs) {
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, fault.delayMs);
      signal.addEventListener('abort', () => { clearTimeout(timer); resolve(); }, { once: true });
    });
    if (signal.aborted) return;
  }
  if (fault.raw !== undefined) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(fault.status).send(fault.raw);
  }
  return res.status(fault.status).json(fault.body);
}
