import { z } from 'zod';

// The shape the UI relies on, AFTER normalize() has cleaned the model output.
// If data passes this schema, the components can render it without defensive checks.

const swapSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive().nullable(),
  unit: z.string().nullable(),
  note: z.string(),
});

const ingredientSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  amount: z.number().positive().nullable(),
  unit: z.string().nullable(),
  fromFridge: z.boolean(),
  swaps: z.array(swapSchema),
});

const stepSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  minutes: z.number().positive().nullable(),
  ingredientIds: z.array(z.string()),
});

export const recipeSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  baseServings: z.number().int().min(1).max(50),
  prepMinutes: z.number().min(0).nullable(),
  cookMinutes: z.number().min(0).nullable(),
  ingredients: z.array(ingredientSchema).min(1, 'Recipe has no usable ingredients'),
  steps: z.array(stepSchema).min(1, 'Recipe has no usable steps'),
});

/** Converts Zod issues into short readable lines (also fed back to the model on retry). */
export function formatIssues(error) {
  return error.issues.slice(0, 8).map((issue) => {
    const path = issue.path.length ? issue.path.join('.') : 'root';
    return `${path}: ${issue.message}`;
  });
}
