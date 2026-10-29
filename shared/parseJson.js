/**
 * Turns raw model text into a JS value, repairing the most common mistakes:
 *  1. ```json fences around the object
 *  2. chatter before/after the object ("Sure! Here's your recipe: {...}")
 *  3. trailing commas ({"a": 1,})
 *
 * Returns { ok: true, value } or { ok: false, error }. Never throws.
 */
export function parseModelJson(text) {
  if (typeof text !== 'string' || text.trim() === '') {
    return { ok: false, error: 'The model returned an empty response.' };
  }

  const attempts = [];
  const trimmed = text.trim();
  attempts.push(trimmed);

  const unfenced = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  attempts.push(unfenced);

  const start = unfenced.indexOf('{');
  const end = unfenced.lastIndexOf('}');
  if (start !== -1 && end > start) {
    const sliced = unfenced.slice(start, end + 1);
    attempts.push(sliced);
    attempts.push(sliced.replace(/,\s*([}\]])/g, '$1'));
  }

  for (const candidate of attempts) {
    try {
      return { ok: true, value: JSON.parse(candidate) };
    } catch {
      // try the next repair
    }
  }
  return { ok: false, error: 'The model returned text that is not valid JSON.' };
}
