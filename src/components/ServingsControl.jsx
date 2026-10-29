export default function ServingsControl({ value, base, onChange }) {
  return (
    <div className="servings">
      <span className="servings-label" id="recipe-servings-label">Serves</span>
      <div className="servings-dial" role="group" aria-labelledby="recipe-servings-label">
        <button onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Fewer servings">−</button>
        <output aria-live="polite" aria-label={`${value} servings`}>{value}</output>
        <button onClick={() => onChange(value + 1)} disabled={value >= 24} aria-label="More servings">+</button>
      </div>
      {value !== base && (
        <button className="link-btn" onClick={() => onChange(base)}>Reset to {base}</button>
      )}
    </div>
  );
}
