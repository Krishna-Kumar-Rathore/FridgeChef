import { validateRecipe } from '../../shared/validateRecipe.js';

export const DEFAULT_TIMEOUT_MS = 45000;

/** An error with a stable `code` the UI can switch on (see lib/errorMessages.js). */
export class RecipeError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'RecipeError';
    this.code = code;
  }
}

/**
 * Calls the backend and returns { recipe, warnings } — or throws RecipeError.
 * The response is validated again here: the client never trusts the network,
 * even our own server.
 *
 * Codes: ABORTED, TIMEOUT, NETWORK, BAD_OUTPUT, EMPTY, NOT_FOOD, RATE_LIMITED,
 *        INVALID_INPUT, CONFIG, SERVER
 */
export async function fetchRecipe(input, { signal, simulate, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  // Our own controller aborts on either the caller's signal or the timeout,
  // and remembers which one fired.
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const onCallerAbort = () => controller.abort();
  signal?.addEventListener('abort', onCallerAbort, { once: true });

  try {
    const url = simulate ? `/api/recipe?simulate=${encodeURIComponent(simulate)}` : '/api/recipe';
    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        signal: controller.signal,
      });
    } catch (err) {
      throw abortOrNetworkError(err, timedOut);
    }

    let text;
    try {
      text = await res.text();
    } catch (err) {
      throw abortOrNetworkError(err, timedOut);
    }

    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      // A proxy error page, a truncated body, ...
      throw new RecipeError(res.ok ? 'BAD_OUTPUT' : codeForStatus(res.status), "The server's reply wasn't valid JSON.");
    }

    if (!res.ok) {
      const code = data?.error?.code;
      const known = ['NOT_FOOD', 'RATE_LIMITED', 'TIMEOUT', 'BAD_OUTPUT', 'INVALID_INPUT', 'CONFIG'];
      throw new RecipeError(known.includes(code) ? code : codeForStatus(res.status), data?.error?.message ?? `HTTP ${res.status}`);
    }

    const result = validateRecipe(data?.recipe);
    if (!result.ok) {
      throw new RecipeError(result.code, result.message ?? result.problems?.join('; '));
    }

    const serverWarnings = Array.isArray(data.warnings) ? data.warnings.filter((w) => typeof w === 'string') : [];
    return { recipe: result.recipe, warnings: [...new Set([...serverWarnings, ...result.warnings])] };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onCallerAbort);
  }
}

function abortOrNetworkError(err, timedOut) {
  if (err?.name === 'AbortError') {
    return timedOut ? new RecipeError('TIMEOUT', 'Request timed out.') : new RecipeError('ABORTED', 'Request cancelled.');
  }
  return new RecipeError('NETWORK', err?.message ?? 'Network error.');
}

function codeForStatus(status) {
  if (status === 429) return 'RATE_LIMITED';
  if (status === 504 || status === 408) return 'TIMEOUT';
  if (status === 400) return 'INVALID_INPUT';
  return 'SERVER';
}
