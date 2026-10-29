import { AppError } from './errors.js';

// Plain fetch against the Gemini REST API (no SDK), so every step is visible.
// Docs: https://ai.google.dev/api/generate-content
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Calls Gemini once and returns the raw text of the first candidate.
 * Throws AppError with a stable code on any failure.
 */
export async function callGemini({ system, messages, signal }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AppError('CONFIG', 'GEMINI_API_KEY is not set on the server. Add it to .env (see .env.example).');
  }
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  let res;
  try {
    res = await fetch(`${API_BASE}/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
        generationConfig: {
          // JSON mode: asks the model for valid JSON. It does NOT guarantee the
          // right shape, which is why we still validate everything ourselves.
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      }),
    });
  } catch (err) {
    if (err.name === 'AbortError' || err.name === 'TimeoutError') {
      throw new AppError('TIMEOUT', 'The AI model took too long to respond.');
    }
    throw new AppError('UPSTREAM', 'Could not reach the AI model.');
  }

  if (res.status === 429) {
    throw new AppError('RATE_LIMITED', 'The AI model is rate-limited (free tier). Wait a few seconds and try again.');
  }
  if (res.status === 400 || res.status === 403) {
    const text = await res.text().catch(() => '');
    if (/api key/i.test(text)) throw new AppError('CONFIG', 'The Gemini API key was rejected. Check GEMINI_API_KEY.');
    if (/not found|model/i.test(text) && res.status === 400) {
      throw new AppError('CONFIG', `Gemini rejected the request. Check GEMINI_MODEL ("${model}").`);
    }
    throw new AppError('UPSTREAM', `The AI model rejected the request (HTTP ${res.status}).`);
  }
  if (res.status === 404) {
    throw new AppError('CONFIG', `Gemini model "${model}" was not found. Check GEMINI_MODEL.`);
  }
  if (!res.ok) {
    throw new AppError('UPSTREAM', `The AI model returned an error (HTTP ${res.status}).`);
  }

  const data = await res.json().catch(() => null);
  const candidate = data?.candidates?.[0];
  const text = candidate?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';

  // An empty string is handled by the caller as "empty output" (and retried).
  return { text, finishReason: candidate?.finishReason ?? data?.promptFeedback?.blockReason ?? 'UNKNOWN' };
}
