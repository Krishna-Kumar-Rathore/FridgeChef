import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { loadSavedSessions, saveSessions, clampServings, MAX_SESSIONS } from '../lib/storage.js';

/**
 * A "session" is one generated recipe plus everything the user did with it:
 * chosen servings, ticked steps, ingredient swaps. Sessions are saved to
 * localStorage so a refresh (or coming back tomorrow) keeps your progress.
 */
function reducer(state, action) {
  const updateActive = (fn) => ({
    ...state,
    sessions: state.sessions.map((s) => (s.id === state.activeId ? fn(s) : s)),
  });

  switch (action.type) {
    case 'create': {
      const sessions = [action.session, ...state.sessions].slice(0, MAX_SESSIONS);
      return { sessions, activeId: action.session.id };
    }
    case 'select':
      return { ...state, activeId: action.id };
    case 'remove': {
      const sessions = state.sessions.filter((s) => s.id !== action.id);
      return { sessions, activeId: state.activeId === action.id ? null : state.activeId };
    }
    case 'setServings':
      return updateActive((s) => ({ ...s, servings: clampServings(action.servings, s.servings) }));
    case 'toggleStep':
      return updateActive((s) => ({
        ...s,
        checked: s.checked.includes(action.stepId)
          ? s.checked.filter((id) => id !== action.stepId)
          : [...s.checked, action.stepId],
      }));
    case 'setSwap':
      return updateActive((s) => {
        const swaps = { ...s.swaps };
        if (action.index == null) delete swaps[action.ingredientId];
        else swaps[action.ingredientId] = action.index;
        return { ...s, swaps };
      });
    case 'resetProgress':
      return updateActive((s) => ({ ...s, checked: [] }));
    default:
      return state;
  }
}

function init() {
  const sessions = loadSavedSessions();
  return { sessions, activeId: sessions[0]?.id ?? null };
}

const newId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `s-${Date.now()}-${Math.random()}`;

export function useSessions() {
  const [state, dispatch] = useReducer(reducer, undefined, init);

  useEffect(() => {
    saveSessions(state.sessions);
  }, [state.sessions]);

  const active = useMemo(
    () => state.sessions.find((s) => s.id === state.activeId) ?? null,
    [state.sessions, state.activeId],
  );

  const create = useCallback(({ recipe, warnings, input }) => {
    dispatch({
      type: 'create',
      session: {
        id: newId(),
        createdAt: Date.now(),
        input,
        recipe,
        warnings,
        servings: clampServings(input?.servings, recipe.baseServings),
        checked: [],
        swaps: {},
      },
    });
  }, []);

  const actions = useMemo(
    () => ({
      select: (id) => dispatch({ type: 'select', id }),
      remove: (id) => dispatch({ type: 'remove', id }),
      setServings: (servings) => dispatch({ type: 'setServings', servings }),
      toggleStep: (stepId) => dispatch({ type: 'toggleStep', stepId }),
      setSwap: (ingredientId, index) => dispatch({ type: 'setSwap', ingredientId, index }),
      resetProgress: () => dispatch({ type: 'resetProgress' }),
    }),
    [],
  );

  return { sessions: state.sessions, active, create, ...actions };
}
