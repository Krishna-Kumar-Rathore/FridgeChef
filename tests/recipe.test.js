import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatAmount, scaleAmount, effectiveIngredient, quantityLabel } from '../src/lib/recipe.js';

test('formatAmount shows kitchen-friendly numbers', () => {
  assert.equal(formatAmount(0.5), '½');
  assert.equal(formatAmount(1.3333), '1⅓');
  assert.equal(formatAmount(0.75), '¾');
  assert.equal(formatAmount(2), '2');
  assert.equal(formatAmount(1.98), '2');
  assert.equal(formatAmount(2.4), '2.4');
  assert.equal(formatAmount(12.4), '12');
  assert.equal(formatAmount(237), '235');
  assert.equal(formatAmount(null), '');
  assert.equal(formatAmount(0.03), '0.03'); // tiny amounts never show as "0"
  assert.equal(formatAmount(0.04), '0.04');
});

test('scaling', () => {
  assert.equal(scaleAmount(4, 2, 3), 6);
  assert.equal(scaleAmount(null, 2, 3), null);
  assert.equal(quantityLabel(scaleAmount(150, 2, 1), 'g'), '75 g');
  assert.equal(quantityLabel(null, 'to taste'), 'to taste');
});

test('swaps', () => {
  const ing = {
    id: 'a', name: 'butter', amount: 2, unit: 'tbsp',
    swaps: [
      { name: 'olive oil', amount: 1.5, unit: 'tbsp', note: '' },
      { name: 'ghee', amount: null, unit: null, note: 'same amount' },
      { name: 'salt', amount: null, unit: 'to taste', note: '' },
    ],
  };
  assert.equal(effectiveIngredient(ing, undefined).name, 'butter');
  assert.deepEqual(
    [effectiveIngredient(ing, 0).amount, effectiveIngredient(ing, 0).swappedFrom],
    [1.5, 'butter'],
  );
  assert.deepEqual([effectiveIngredient(ing, 1).amount, effectiveIngredient(ing, 1).unit], [2, 'tbsp']);
  assert.deepEqual([effectiveIngredient(ing, 2).amount, effectiveIngredient(ing, 2).unit], [null, 'to taste']);
  assert.equal(effectiveIngredient(ing, 9).name, 'butter'); // stale swap index is ignored
});
