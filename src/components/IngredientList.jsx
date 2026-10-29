import { useState } from 'react';
import { quantityLabel, scaleAmount } from '../lib/recipe.js';

export default function IngredientList({ ingredients, shown, servings, baseServings, swaps, onSwap }) {
  const [openId, setOpenId] = useState(null);

  const rows = ingredients.map((original, i) => ({ original, shown: shown[i] }));
  const groups = [
    { key: 'have', title: 'From your fridge', rows: rows.filter((r) => r.original.fromFridge) },
    { key: 'need', title: 'You may also need', rows: rows.filter((r) => !r.original.fromFridge) },
  ].filter((g) => g.rows.length);

  return (
    <section className="ingredients" aria-labelledby="ingredients-heading">
      <h3 id="ingredients-heading">Ingredients</h3>
      {groups.map((group) => (
        <div key={group.key} className="ing-group">
          <h4>{group.title}</h4>
          <ul>
            {group.rows.map(({ original, shown: ing }) => {
              const qty = quantityLabel(scaleAmount(ing.amount, baseServings, servings), ing.unit);
              const isOpen = openId === original.id;
              return (
                <li key={original.id} className={`ing ${ing.swappedFrom ? 'is-swapped' : ''}`}>
                  <div className="ing-row">
                    <span className="ing-qty">{qty}</span>
                    <span className="ing-name">
                      {ing.name}
                      {ing.swappedFrom && <span className="ing-was">instead of {ing.swappedFrom}</span>}
                    </span>
                    {ing.swappedFrom ? (
                      <button className="link-btn" onClick={() => onSwap(original.id, null)}>Undo swap</button>
                    ) : (
                      original.swaps.length > 0 && (
                        <button
                          className="link-btn"
                          aria-expanded={isOpen}
                          aria-controls={`swaps-${original.id}`}
                          onClick={() => setOpenId(isOpen ? null : original.id)}
                        >
                          {isOpen ? 'Close' : 'Swap'}
                        </button>
                      )
                    )}
                  </div>
                  {ing.note && <p className="ing-note">{ing.note}</p>}
                  {isOpen && !ing.swappedFrom && (
                    <ul className="swap-list" id={`swaps-${original.id}`}>
                      {original.swaps.map((s, index) => (
                        <li key={index}>
                          <button
                            className="swap-option"
                            onClick={() => {
                              onSwap(original.id, index);
                              setOpenId(null);
                            }}
                          >
                            <span>Use {s.name}</span>
                            {s.note && <span className="swap-note">{s.note}</span>}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}
