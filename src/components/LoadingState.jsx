import { useEffect, useState } from 'react';

// Honest progress copy: what is actually happening, changing as time passes.
const MESSAGES = [
  [0, 'Reading your ingredients'],
  [3, 'Writing the recipe'],
  [9, 'Still writing — bigger lists take longer'],
  [18, 'The AI is slow right now. You can stop and try again'],
];

export default function LoadingState({ startedAt, onCancel }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  const seconds = Math.max(0, Math.floor((now - (startedAt ?? now)) / 1000));
  const message = [...MESSAGES].reverse().find(([s]) => seconds >= s)[1];

  return (
    <div className="loading" role="status">
      <div className="pan" aria-hidden="true">
        <span className="pan-yolk" />
      </div>
      <div className="loading-text">
        <p className="loading-message">{message}…</p>
        <p className="loading-time">{seconds}s · press Esc to stop</p>
      </div>
      <button className="btn" onClick={onCancel}>Stop</button>
      <div className="skeleton" aria-hidden="true">
        <span /><span /><span /><span />
      </div>
    </div>
  );
}
