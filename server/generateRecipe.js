import { callGemini } from './gemini.js';
import { SYSTEM_PROMPT, buildUserPrompt, buildRepairPrompt } from './prompt.js';
import { parseModelJson } from '../shared/parseJson.js';
import { validateRecipe } from '../shared/validateRecipe.js';
import { AppError } from './errors.js';

const ATTEMPT_TIMEOUT_MS = Number(process.env.MODEL_TIMEOUT_MS) || 20000;

/**
 * prompt -> model -> parse -> validate. If the output is unusable, retry ONCE,
 * showing the model its previous reply and the exact problems.
 * Returns { recipe, warnings, meta } or throws AppError.
 */
export async function generateRecipe(input, { signal } = {}) {
  const messages = [{ role: 'user', text: buildUserPrompt(input) }];
  let lastProblems = [];

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const attemptSignal = combineSignals(signal, AbortSignal.timeout(ATTEMPT_TIMEOUT_MS));
    const { text } = await callGemini({ system: SYSTEM_PROMPT, messages, signal: attemptSignal });

    const parsed = parseModelJson(text);
    let result;
    if (!parsed.ok) {
      result = { ok: false, code: text?.trim() ? 'BAD_OUTPUT' : 'EMPTY', problems: [parsed.error] };
    } else {
      result = validateRecipe(parsed.value);
    }

    if (result.ok) {
      return { recipe: result.recipe, warnings: result.warnings, meta: { attempts: attempt } };
    }
    if (result.code === 'NOT_FOOD') {
      throw new AppError('NOT_FOOD', result.message);
    }

    lastProblems = result.problems;
    console.warn(`[recipe] attempt ${attempt} unusable (${result.code}):`, lastProblems);

    // Keep the conversation so the model sees its own mistake.
    messages.push({ role: 'model', text: text || '(empty)' });
    messages.push({ role: 'user', text: buildRepairPrompt(text, lastProblems) });
  }

  throw new AppError(
    'BAD_OUTPUT',
    'The AI returned a recipe the app could not use, even after a retry.',
    lastProblems,
  );
}

function combineSignals(a, b) {
  if (!a) return b;
  if (typeof AbortSignal.any === 'function') return AbortSignal.any([a, b]);
  const controller = new AbortController();
  const abort = () => controller.abort();
  a.addEventListener('abort', abort, { once: true });
  b.addEventListener('abort', abort, { once: true });
  return controller.signal;
}
