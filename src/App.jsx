import { useEffect, useRef, useState } from 'react';
import { useRecipeRequest } from './hooks/useRecipeRequest.js';
import { useSessions } from './hooks/useSessions.js';
import IngredientForm from './components/IngredientForm.jsx';
import SavedRecipes from './components/SavedRecipes.jsx';
import LoadingState from './components/LoadingState.jsx';
import StatusMessage from './components/StatusMessage.jsx';
import Welcome from './components/Welcome.jsx';
import RecipeView from './components/RecipeView.jsx';
import DebugPanel from './components/DebugPanel.jsx';

const DEBUG = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug');
const EMPTY_FORM = { ingredients: '', servings: 2, diet: [] };

export default function App() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [simulate, setSimulate] = useState('');
  const textareaRef = useRef(null);
  const stageRef = useRef(null);

  // On phones the form sits above the result, so bring the result into view.
  const scrollToStage = () => {
    if (window.matchMedia('(max-width: 959px)').matches) {
      requestAnimationFrame(() => stageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  };

  const sessions = useSessions();
  const request = useRecipeRequest({
    onSuccess: (result, input) => {
      sessions.create({ ...result, input });
      scrollToStage();
    },
  });

  // Only set in ?debug=1 test mode. The "slow" mode shortens the client
  // timeout so the demo doesn't wait 45s.
  const requestOptions = simulate ? { simulate, ...(simulate === 'slow' && { timeoutMs: 8000 }) } : {};

  const submit = () => {
    const input = { ...form, ingredients: form.ingredients.trim() };
    if (!input.ingredients) return;
    request.run(input, requestOptions);
    scrollToStage();
  };

  const retry = () => {
    if (request.lastInput) request.run(request.lastInput, requestOptions);
  };

  const editInput = () => {
    request.dismiss();
    textareaRef.current?.focus();
    textareaRef.current?.select();
  };

  const openSaved = (session) => {
    request.dismiss();
    sessions.select(session.id);
    setForm({ ...EMPTY_FORM, ...session.input });
    scrollToStage();
  };

  // Escape cancels a running request.
  const { status, cancel } = request;
  useEffect(() => {
    if (status !== 'loading') return;
    const onKey = (e) => e.key === 'Escape' && cancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [status, cancel]);

  const isLoading = request.status === 'loading';
  const showRecipe = sessions.active && !isLoading;

  return (
    <div className="app">
      <aside className="panel">
        <header className="brand">
          <span className="brand-yolk" aria-hidden="true" />
          <div>
            <h1>Fridge Chef</h1>
            <p>Tell it what you have. Get something to cook.</p>
          </div>
        </header>

        <IngredientForm
          value={form}
          onChange={setForm}
          onSubmit={submit}
          onCancel={request.cancel}
          isLoading={isLoading}
          textareaRef={textareaRef}
        />

        {DEBUG && <DebugPanel value={simulate} onChange={setSimulate} />}

        <SavedRecipes
          sessions={sessions.sessions}
          activeId={sessions.active?.id}
          onOpen={openSaved}
          onRemove={sessions.remove}
        />
      </aside>

      <main className="stage" ref={stageRef} aria-busy={isLoading}>
        <div aria-live="polite" className="status-region">
          {isLoading && <LoadingState startedAt={request.startedAt} onCancel={request.cancel} />}
          {request.status === 'error' && (
            <StatusMessage
              error={request.error}
              onRetry={retry}
              onEdit={editInput}
              onDismiss={sessions.active ? request.dismiss : null}
            />
          )}
        </div>

        {showRecipe && (
          <RecipeView
            key={sessions.active.id}
            session={sessions.active}
            onServingsChange={sessions.setServings}
            onToggleStep={sessions.toggleStep}
            onSwap={sessions.setSwap}
            onResetProgress={sessions.resetProgress}
            dimmed={request.status === 'error'}
          />
        )}

        {!showRecipe && request.status === 'idle' && (
          <Welcome onPick={(ingredients) => setForm((f) => ({ ...f, ingredients }))} />
        )}
      </main>
    </div>
  );
}
