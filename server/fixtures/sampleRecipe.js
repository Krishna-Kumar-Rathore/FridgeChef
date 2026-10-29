// A known-good recipe, used by the fault-injection modes so the UI can be
// demoed and tested without an API key or network.
export const SAMPLE_RECIPE = {
  title: 'Spinach & Feta Skillet Eggs',
  description: 'Soft eggs baked in garlicky spinach with salty feta. Ready in 20 minutes.',
  baseServings: 2,
  prepMinutes: 5,
  cookMinutes: 15,
  ingredients: [
    { id: 'ing-1', name: 'eggs', amount: 4, unit: null, fromFridge: true, swaps: [{ name: 'firm tofu, crumbled', amount: 200, unit: 'g', note: 'Vegan; season well.' }] },
    { id: 'ing-2', name: 'spinach', amount: 150, unit: 'g', fromFridge: true, swaps: [{ name: 'kale', amount: 120, unit: 'g', note: 'Remove stems; cook 2 min longer.' }, { name: 'frozen spinach', amount: 120, unit: 'g', note: 'Squeeze out the water first.' }] },
    { id: 'ing-3', name: 'feta', amount: 60, unit: 'g', fromFridge: true, swaps: [{ name: 'paneer', amount: 60, unit: 'g', note: 'Milder; add a pinch more salt.' }] },
    { id: 'ing-4', name: 'onion', amount: 0.5, unit: null, fromFridge: true, swaps: [{ name: 'spring onions', amount: 3, unit: null, note: 'Add with the spinach.' }] },
    { id: 'ing-5', name: 'garlic cloves', amount: 2, unit: null, fromFridge: false, swaps: [{ name: 'garlic powder', amount: 0.5, unit: 'tsp', note: '' }] },
    { id: 'ing-6', name: 'olive oil', amount: 1, unit: 'tbsp', fromFridge: false, swaps: [{ name: 'butter', amount: 1, unit: 'tbsp', note: '' }] },
    { id: 'ing-7', name: 'salt and pepper', amount: null, unit: 'to taste', fromFridge: false, swaps: [] },
  ],
  steps: [
    { id: 'step-1', text: 'Finely chop the onion and slice the garlic.', minutes: 3, ingredientIds: ['ing-4', 'ing-5'] },
    { id: 'step-2', text: 'Heat the oil in a pan over medium heat and soften the onion.', minutes: 4, ingredientIds: ['ing-6', 'ing-4'] },
    { id: 'step-3', text: 'Add the garlic and spinach; stir until the spinach wilts.', minutes: 2, ingredientIds: ['ing-5', 'ing-2'] },
    { id: 'step-4', text: 'Make small wells in the spinach and crack an egg into each.', minutes: null, ingredientIds: ['ing-1'] },
    { id: 'step-5', text: 'Crumble the feta over the top, cover, and cook until the whites set.', minutes: 6, ingredientIds: ['ing-3'] },
    { id: 'step-6', text: 'Season with salt and pepper and serve straight from the pan.', minutes: null, ingredientIds: ['ing-7'] },
  ],
  warnings: [],
};
