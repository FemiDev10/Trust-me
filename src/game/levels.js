// Levels + local progress. Guarded: if the engine doesn't export LEVELS yet,
// there is a single level. Progress lives in localStorage; if storage is
// unavailable, every level is unlocked.
import * as Engine from '../engine/index.js';

const FALLBACK = [{ id: 1, name: 'Rookie', tagline: 'A clumsy cheater. Learn the ropes.', cheaterIq: 1 }];
export const LEVELS = Array.isArray(Engine.LEVELS) && Engine.LEVELS.length ? Engine.LEVELS : FALLBACK;
export const levelById = (id) => LEVELS.find((l) => l.id === id) ?? LEVELS[0];
export const nextLevel = (id) => {
  const i = LEVELS.findIndex((l) => l.id === id);
  return i >= 0 && i < LEVELS.length - 1 ? LEVELS[i + 1] : null;
};

const KEY = 'tm-solved-levels';

function readSolved() {
  try {
    const raw = localStorage.getItem(KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return null; // storage unavailable
  }
}

/** Is a level playable? Level 1 always; others once the previous is solved. */
export function isUnlocked(id) {
  const i = LEVELS.findIndex((l) => l.id === id);
  if (i <= 0) return true;
  const solved = readSolved();
  if (!solved) return true;
  return solved.has(LEVELS[i - 1].id);
}

export function isSolved(id) {
  const solved = readSolved();
  return solved ? solved.has(id) : false;
}

export function markSolved(id) {
  try {
    const solved = readSolved() ?? new Set();
    solved.add(id);
    localStorage.setItem(KEY, JSON.stringify([...solved]));
  } catch { /* ignore */ }
}
