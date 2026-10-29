import { formatMinutes } from '../lib/recipe.js';

export default function StepList({ steps, checked, ingredientsById, onToggle, onReset }) {
  const done = steps.filter((s) => checked.includes(s.id)).length;
  const pct = Math.round((done / steps.length) * 100);
  const allDone = done === steps.length;

  return (
    <section className="steps" aria-labelledby="steps-heading">
      <div className="steps-head">
        <h3 id="steps-heading">Method</h3>
        <span className="steps-count">{allDone ? 'All done. Enjoy!' : `${done} of ${steps.length} done`}</span>
        {done > 0 && <button className="link-btn" onClick={onReset}>Start over</button>}
      </div>
      <div
        className="progress"
        role="progressbar"
        aria-label="Cooking progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <span style={{ width: `${pct}%` }} />
      </div>

      <ol>
        {steps.map((step, i) => {
          const isDone = checked.includes(step.id);
          const chips = step.ingredientIds.map((id) => ingredientsById[id]).filter(Boolean);
          return (
            <li key={step.id} className={`step ${isDone ? 'is-done' : ''}`}>
              <label className="step-label">
                <input type="checkbox" checked={isDone} onChange={() => onToggle(step.id)} />
                <span className="step-num" aria-hidden="true">{i + 1}</span>
                <span className="step-content">
                  <span className="step-text">{step.text}</span>
                  {(chips.length > 0 || step.minutes) && (
                    <span className="step-meta">
                      {step.minutes && <span className="step-time">{formatMinutes(step.minutes)}</span>}
                      {chips.map((c) => (
                        <span key={c.id} className={`step-chip ${c.swappedFrom ? 'is-swapped' : ''}`}>{c.name}</span>
                      ))}
                    </span>
                  )}
                </span>
              </label>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
