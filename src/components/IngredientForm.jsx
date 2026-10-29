const MAX_CHARS = 1000;
const DIETS = [
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'gluten-free', label: 'Gluten-free' },
  { id: 'dairy-free', label: 'Dairy-free' },
];

export default function IngredientForm({ value, onChange, onSubmit, onCancel, isLoading, textareaRef }) {
  const length = value.ingredients.length;
  const tooLong = length > MAX_CHARS;
  // Submitting while a request is running is allowed on purpose: the new
  // request replaces the old one (see useRecipeRequest's stale guard).
  const canSubmit = value.ingredients.trim().length > 0 && !tooLong;

  const set = (patch) => onChange({ ...value, ...patch });
  const toggleDiet = (id) =>
    set({ diet: value.diet.includes(id) ? value.diet.filter((d) => d !== id) : [...value.diet, id] });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (canSubmit) onSubmit();
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label htmlFor="ingredients" className="field-label">What's in your fridge?</label>
      <textarea
        id="ingredients"
        ref={textareaRef}
        value={value.ingredients}
        onChange={(e) => set({ ingredients: e.target.value })}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(e);
        }}
        placeholder="eggs, half an onion, spinach, some feta, leftover rice…"
        rows={4}
        aria-describedby="ingredients-hint"
        aria-invalid={tooLong}
      />
      <div id="ingredients-hint" className={`hint ${tooLong ? 'hint-error' : ''}`}>
        {tooLong ? `Too long by ${length - MAX_CHARS} characters.` : 'Commas or new lines both work. Ctrl + Enter to cook.'}
        <span className="count">{length}/{MAX_CHARS}</span>
      </div>

      <div className="form-row">
        <span className="field-label" id="servings-label">Servings</span>
        <div className="stepper" role="group" aria-labelledby="servings-label">
          <button type="button" onClick={() => set({ servings: Math.max(1, value.servings - 1) })} aria-label="Fewer servings" disabled={value.servings <= 1}>−</button>
          <output aria-live="polite">{value.servings}</output>
          <button type="button" onClick={() => set({ servings: Math.min(12, value.servings + 1) })} aria-label="More servings" disabled={value.servings >= 12}>+</button>
        </div>
      </div>

      <fieldset className="diets">
        <legend className="field-label">Diet (optional)</legend>
        {DIETS.map((d) => (
          <label key={d.id} className="chip">
            <input type="checkbox" checked={value.diet.includes(d.id)} onChange={() => toggleDiet(d.id)} />
            <span>{d.label}</span>
          </label>
        ))}
      </fieldset>

      <div className="submit-row">
        <button type="submit" className="btn btn-primary btn-block" disabled={!canSubmit}>
          {isLoading ? 'Restart with this list' : 'Make a recipe'}
        </button>
        {isLoading && (
          <button type="button" className="btn btn-block" onClick={onCancel}>Stop</button>
        )}
      </div>
    </form>
  );
}
