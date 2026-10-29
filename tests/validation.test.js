import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseModelJson } from '../shared/parseJson.js';
import { parseAmount } from '../shared/amount.js';
import { validateRecipe } from '../shared/validateRecipe.js';
import { SAMPLE_RECIPE } from '../server/fixtures/sampleRecipe.js';

test('parseModelJson repairs fences, chatter and trailing commas', () => {
  assert.deepEqual(parseModelJson('```json\n{"a":1}\n```').value, { a: 1 });
  assert.deepEqual(parseModelJson('Sure! Here it is: {"a": [1, 2,],} Enjoy').value, { a: [1, 2] });
  assert.equal(parseModelJson('').ok, false);
  assert.equal(parseModelJson('{"a": ').ok, false);
  assert.equal(parseModelJson(undefined).ok, false);
});

test('parseAmount handles the formats models actually send', () => {
  assert.deepEqual(parseAmount(2), { amount: 2, unit: null });
  assert.deepEqual(parseAmount('1/2'), { amount: 0.5, unit: null });
  assert.deepEqual(parseAmount('1 1/2 cups'), { amount: 1.5, unit: 'cups' });
  assert.deepEqual(parseAmount('2-3'), { amount: 2.5, unit: null });
  assert.deepEqual(parseAmount('200g'), { amount: 200, unit: 'g' });
  assert.deepEqual(parseAmount('½'), { amount: 0.5, unit: null });
  assert.deepEqual(parseAmount('1½ tbsp'), { amount: 1.5, unit: 'tbsp' });
  assert.deepEqual(parseAmount('a pinch'), { amount: null, unit: 'a pinch' });
  assert.deepEqual(parseAmount(-1), { amount: null, unit: null });
  assert.deepEqual(parseAmount(null), { amount: null, unit: null });
});

test('a good recipe passes unchanged', () => {
  const r = validateRecipe(SAMPLE_RECIPE);
  assert.equal(r.ok, true);
  assert.equal(r.recipe.ingredients.length, 7);
  assert.deepEqual(r.warnings, []);
});

test('wrapped {recipe: ...} is unwrapped', () => {
  assert.equal(validateRecipe({ recipe: SAMPLE_RECIPE }).ok, true);
});

test('NOT_FOOD, empty and non-object answers are classified', () => {
  assert.equal(validateRecipe({ error: 'NOT_FOOD', message: 'nope' }).code, 'NOT_FOOD');
  assert.equal(validateRecipe({}).code, 'EMPTY');
  assert.equal(validateRecipe(null).code, 'EMPTY');
  assert.equal(validateRecipe({ title: 'x', ingredients: [], steps: [] }).code, 'EMPTY');
  assert.equal(validateRecipe([1, 2]).code, 'BAD_OUTPUT');
  assert.equal(validateRecipe('hello').code, 'BAD_OUTPUT');
});

test('wrong shape is rejected with readable problems', () => {
  const r = validateRecipe({ title: 42, ingredients: [{ qty: 2 }], steps: ['Boil water'] });
  assert.equal(r.ok, false);
  assert.equal(r.code, 'BAD_OUTPUT');
  assert.ok(r.problems.some((p) => p.includes('ingredients')));
});

test('messy output is salvaged with warnings', () => {
  const r = validateRecipe({
    title: '',
    ingredients: ['2 eggs', { name: 'milk', amount: '1/2', unit: 'cup', swaps: ['oat milk', { bad: true }] }, { amount: 3 }],
    steps: ['Whisk.', { text: 'Cook.', ingredientIds: ['ing-1', 'nope'], minutes: '5' }, { text: '' }],
  });
  assert.equal(r.ok, true);
  assert.equal(r.recipe.baseServings, 2);
  assert.equal(r.recipe.ingredients.length, 2);
  assert.equal(r.recipe.ingredients[1].amount, 0.5);
  assert.deepEqual(r.recipe.ingredients[1].swaps.map((s) => s.name), ['oat milk']);
  assert.deepEqual(r.recipe.steps[1].ingredientIds, ['ing-1']);
  assert.equal(r.recipe.steps[1].minutes, 5);
  assert.ok(r.warnings.length >= 3);
});

test('duplicate ids are made unique', () => {
  const r = validateRecipe({
    title: 't',
    baseServings: 2,
    ingredients: [{ id: 'a', name: 'x' }, { id: 'a', name: 'y' }],
    steps: [{ id: 'a', text: 'go' }],
  });
  const ids = [...r.recipe.ingredients, ...r.recipe.steps].map((x) => x.id);
  assert.equal(new Set(ids).size, ids.length);
});
