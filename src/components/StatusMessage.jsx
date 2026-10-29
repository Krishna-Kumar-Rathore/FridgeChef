import { describeError } from '../lib/errorMessages.js';

export default function StatusMessage({ error, onRetry, onEdit, onDismiss }) {
  const copy = describeError(error);
  return (
    <div className={`status status-${copy.kind}`} role={copy.kind === 'error' ? 'alert' : 'status'}>
      <h2>{copy.title}</h2>
      <p>{copy.body}</p>
      <div className="actions">
        {copy.retry && <button className="btn btn-primary" onClick={onRetry}>Try again</button>}
        {copy.edit && <button className="btn" onClick={onEdit}>Edit ingredients</button>}
        {onDismiss && <button className="btn btn-ghost" onClick={onDismiss}>Back to my recipe</button>}
      </div>
      {error?.code && <p className="status-code">Error code: {error.code}</p>}
    </div>
  );
}
