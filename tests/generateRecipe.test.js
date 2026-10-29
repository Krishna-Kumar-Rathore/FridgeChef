import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { generateRecipe } from '../server/generateRecipe.js';
import { SAMPLE_RECIPE } from '../server/fixtures/sampleRecipe.js';

// Fake Gemini: each call returns the next scripted reply.
const realFetch = globalThis.fetch;
let calls;

function scriptGemini(replies) {
  calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push(JSON.parse(init.body));
    const reply = replies[calls.length - 1];
    if (reply.status) return new Response('{}', { status: reply.status });
    return Response.json({ candidates: [{ content: { parts: [{ text: reply.text }] }, finishReason: 'STOP' }] });
  };
}

const input = { ingredients: 'eggs, spinach', servings: 2, diet: [] };

beforeEach(() => {
  process.env.GEMINI_API_KEY = 'test-key';
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

test('good output on the first try', async () => {
  scriptGemini([{ text: JSON.stringify(SAMPLE_RECIPE) }]);
  const r = await generateRecipe(input);
  assert.equal(r.recipe.title, SAMPLE_RECIPE.title);
  assert.equal(r.meta.attempts, 1);
});

test('malformed output is retried once, with the problems sent back', async () => {
  scriptGemini([{ text: '{"title": "oops", "ingredients": [' }, { text: JSON.stringify(SAMPLE_RECIPE) }]);
  const r = await generateRecipe(input);
  assert.equal(r.meta.attempts, 2);
  const retryPrompt = calls[1].contents.at(-1).parts[0].text;
  assert.match(retryPrompt, /not valid JSON/);
  assert.equal(calls[1].contents.length, 3); // user, model (bad reply), user (repair)
});

test('two bad outputs in a row -> BAD_OUTPUT', async () => {
  scriptGemini([{ text: '{"title": 1}' }, { text: 'still not json' }]);
  await assert.rejects(generateRecipe(input), { code: 'BAD_OUTPUT' });
});

test('NOT_FOOD is not retried', async () => {
  scriptGemini([{ text: '{"error":"NOT_FOOD","message":"That is a car."}' }]);
  await assert.rejects(generateRecipe(input), { code: 'NOT_FOOD', message: 'That is a car.' });
  assert.equal(calls.length, 1);
});

test('429 -> RATE_LIMITED', async () => {
  scriptGemini([{ status: 429 }]);
  await assert.rejects(generateRecipe(input), { code: 'RATE_LIMITED' });
});

test('missing API key -> CONFIG', async () => {
  delete process.env.GEMINI_API_KEY;
  await assert.rejects(generateRecipe(input), { code: 'CONFIG' });
});
