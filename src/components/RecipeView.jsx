import { useMemo } from 'react';
import { effectiveIngredient, formatMinutes } from '../lib/recipe.js';
import ServingsControl from './ServingsControl.jsx';
import Warnings from './Warnings.jsx';
import IngredientList from './IngredientList.jsx';
import StepList from './StepList.jsx';

export default function RecipeView({ session, onServingsChange, onToggleStep, onSwap, onResetProgress, dimmed }) {
  const { recipe, servings, swaps, checked, warnings } = session;

  // Ingredients as currently shown (after swaps), looked up by id for the step chips.
  const shownIngredients = useMemo(
    () => recipe.ingredients.map((ing) => effectiveIngredient(ing, swaps[ing.id])),
    [recipe.ingredients, swaps],
  );
  const byId = useMemo(() => Object.fromEntries(shownIngredients.map((i) => [i.id, i])), [shownIngredients]);

  const times = [
    recipe.prepMinutes && `Prep ${formatMinutes(recipe.prepMinutes)}`,
    recipe.cookMinutes && `Cook ${formatMinutes(recipe.cookMinutes)}`,
  ].filter(Boolean);

  return (
    <article className={`recipe ${dimmed ? 'is-dimmed' : ''}`}>
      <header className="recipe-head">
        <div className="recipe-title">
          <h2>{recipe.title}</h2>
          {recipe.description && <p className="recipe-desc">{recipe.description}</p>}
          {times.length > 0 && (
            <ul className="recipe-times">
              {times.map((t) => <li key={t}>{t}</li>)}
            </ul>
          )}
        </div>
        <ServingsControl value={servings} base={recipe.baseServings} onChange={onServingsChange} />
      </header>

      <Warnings warnings={warnings} />

      <div className="recipe-body">
        <IngredientList
          ingredients={recipe.ingredients}
          shown={shownIngredients}
          servings={servings}
          baseServings={recipe.baseServings}
          swaps={swaps}
          onSwap={onSwap}
        />
        <StepList steps={recipe.steps} checked={checked} ingredientsById={byId} onToggle={onToggleStep} onReset={onResetProgress} />
      </div>
    </article>
  );
}
