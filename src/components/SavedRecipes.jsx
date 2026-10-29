import { timeAgo } from '../lib/recipe.js';

export default function SavedRecipes({ sessions, activeId, onOpen, onRemove }) {
  if (!sessions.length) return null;
  return (
    <section className="saved" aria-labelledby="saved-heading">
      <h2 id="saved-heading">Your recipes</h2>
      <ul>
        {sessions.map((s) => {
          // Count like StepList does: only ticks that match a step in this recipe.
          const done = s.recipe.steps.filter((step) => s.checked.includes(step.id)).length;
          const total = s.recipe.steps.length;
          return (
            <li key={s.id} className={s.id === activeId ? 'is-active' : ''}>
              <button className="saved-open" onClick={() => onOpen(s)} aria-current={s.id === activeId ? 'true' : undefined}>
                <span className="saved-title">{s.recipe.title}</span>
                <span className="saved-meta">
                  {done === total ? 'Cooked' : done ? `${done} of ${total} steps done` : 'Not started'}, {timeAgo(s.createdAt)}
                </span>
              </button>
              <button className="icon-btn" onClick={() => onRemove(s.id)} aria-label={`Delete ${s.recipe.title}`}>×</button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
