import { useCallback, useEffect, useReducer, useRef } from 'react';
import { fetchRecipe } from '../api/fetchRecipe.js';

/**
 * Owns the lifecycle of "ask the AI for a recipe".
 *
 *   idle ──run──▶ loading ──▶ success   (onSuccess is called with the result)
 *                    │   └──▶ error     (error.code says what kind)
 *                    └─cancel─▶ idle
 *
 * Stale responses: every run gets an increasing id, and the previous request is
 * aborted. A result is only applied if its id is still the latest one, so an
 * old, slow response can never overwrite a newer one.
 */
const initialState = { status: 'idle', error: null, lastInput: null, startedAt: null };

function reducer(state, action) {
  switch (action.type) {
    case 'start':
      return { status: 'loading', error: null, lastInput: action.input, startedAt: action.startedAt };
    case 'success':
      return { ...state, status: 'success', error: null };
    case 'error':
      return { ...state, status: 'error', error: action.error };
    case 'cancel':
      return { ...state, status: 'idle', error: null };
    case 'dismiss':
      return { ...state, status: 'idle', error: null };
    default:
      return state;
  }
}

export function useRecipeRequest({ onSuccess }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const latestId = useRef(0);
  const controllerRef = useRef(null);

  // Keep the latest callback without re-creating `run` on every render.
  const onSuccessRef = useRef(onSuccess);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  });

  const run = useCallback(async (input, options = {}) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const id = ++latestId.current;

    dispatch({ type: 'start', input, startedAt: Date.now() });
    try {
      const result = await fetchRecipe(input, { signal: controller.signal, ...options });
      if (id !== latestId.current) return; // stale: a newer request started
      dispatch({ type: 'success' });
      onSuccessRef.current?.(result, input);
    } catch (error) {
      if (id !== latestId.current) return; // stale
      if (error.code === 'ABORTED') return; // cancel() already updated state
      dispatch({ type: 'error', error: { code: error.code ?? 'SERVER', message: error.message } });
    }
  }, []);

  const cancel = useCallback(() => {
    latestId.current += 1; // anything in flight is now stale
    controllerRef.current?.abort();
    dispatch({ type: 'cancel' });
  }, []);

  const dismiss = useCallback(() => dispatch({ type: 'dismiss' }), []);

  // Abort on unmount.
  useEffect(() => () => controllerRef.current?.abort(), []);

  return { ...state, run, cancel, dismiss };
}
