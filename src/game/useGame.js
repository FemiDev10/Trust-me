// The one game-state hook: useReducer around the pure engine `step`.
// The UI never re-implements rules; it only dispatches engine actions.
import { useCallback, useReducer, useRef } from 'react';
import { createGame, step } from '../engine/index.js';
import { LEVELS } from './levels.js';

const NEW_GAME = '@@ui/NEW_GAME';
const CLEAR = '@@ui/CLEAR';

function reducer(state, action) {
  if (action.type === NEW_GAME) return action.state;
  if (action.type === CLEAR) return null;
  if (!state) return state;
  return step(state, action);
}

export const randomSeed = () => `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;

/** { state, dispatch(action), newGame(seed?, level?), quit(), level }. `state` is null before a game starts. */
export function useGame() {
  const [state, rawDispatch] = useReducer(reducer, null);
  const levelRef = useRef(LEVELS[0].id);
  const dispatch = useCallback((action) => rawDispatch(action), []);
  const newGame = useCallback((seed = randomSeed(), level = levelRef.current) => {
    levelRef.current = level ?? LEVELS[0].id;
    rawDispatch({ type: NEW_GAME, state: createGame({ seed, mode: 'home', level: levelRef.current }) });
  }, []);
  const quit = useCallback(() => rawDispatch({ type: CLEAR }), []);
  /** Resume a saved game state as-is. */
  const resume = useCallback((saved, level) => {
    if (level) levelRef.current = level;
    rawDispatch({ type: NEW_GAME, state: saved });
  }, []);
  const lv = state?.level;
  const level = typeof lv === 'number' ? lv : lv?.id ?? levelRef.current;
  return { state, dispatch, newGame, quit, resume, level };
}
