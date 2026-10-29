import { Component } from 'react';
import { clearSavedSessions } from '../lib/storage.js';

// Last line of defence: if a render bug slips through, show a way out
// instead of a blank page. (Error boundaries still require a class component.)
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Render error', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="crash">
        <h1>Something broke while showing this page.</h1>
        <p>Reloading usually fixes it. If it keeps happening, clear the saved recipes and reload.</p>
        <div className="actions">
          <button className="btn btn-primary" onClick={() => window.location.reload()}>Reload</button>
          <button
            className="btn"
            onClick={() => {
              clearSavedSessions();
              window.location.reload();
            }}
          >
            Clear saved recipes and reload
          </button>
        </div>
      </main>
    );
  }
}
