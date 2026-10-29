import { validateRecipe } from '../../shared/validateRecipe.js';

// Versioned key: if the saved shape ever changes, bump it and old data is ignored.
const KEY = 'fridge-chef:sessions:v1';
const MAX_SESSIONS = 8;

/**
 * Reads saved sessions. localStorage can throw (private mode, blocked storage)
 * or hold corrupt/old data, so every saved recipe goes through the same
 * validation as a fresh model response.
 */
export function loadSavedSessions() {
  let raw;
  try {
    raw = JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
  if (!Array.isArray(raw)) return [];

  return raw
    .map((s) => {
      if (!s || typeof s !== 'object' || typeof s.id !== 'string') return null;
      const check = validateRecipe(s.recipe);
      if (!check.ok) return null;
      return {
        id: s.id,
        createdAt: Number(s.createdAt) || Date.now(),
        input: s.input && typeof s.input === 'object' ? s.input : { ingredients: '', servings: 2, diet: [] },
        recipe: check.recipe,
        warnings: Array.isArray(s.warnings) ? s.warnings.filter((w) => typeof w === 'string') : [],
        servings: clampServings(s.servings, check.recipe.baseServings),
        checked: Array.isArray(s.checked) ? s.checked.filter((id) => typeof id === 'string') : [],
        swaps: s.swaps && typeof s.swaps === 'object' ? s.swaps : {},
      };
    })
    .filter(Boolean)
    .slice(0, MAX_SESSIONS);
}

export function saveSessions(sessions) {
  try {
    localStorage.setItem(KEY, JSON.stringify(sessions.slice(0, MAX_SESSIONS)));
  } catch {
    // Storage full or blocked: the app still works, it just won't remember.
  }
}

export function clearSavedSessions() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function clampServings(value, fallback = 2) {
  const n = Math.round(Number(value));
  return Number.isFinite(n) && n >= 1 && n <= 24 ? n : fallback;
}

export { MAX_SESSIONS };
