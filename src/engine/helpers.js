// Small shared helpers over game state. Mutating helpers only ever run on the
// draft copy inside step(), never on a state the caller holds.

import { ROBOT_IDS, castById } from './data/cast.js';
import { isImportant } from './data/keys.js';
import { conceptLabel, conceptNote } from './data/concepts.js';

export const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
export const nameOf = (id) => castById(id)?.name ?? id;

export const isSittingOut = (state, id) => state.robots[id].sitOutDay === state.day;
export const isUnplugged = (state, id) => state.robots[id].status === 'unplugged';

/** Robots still in the game (at the meeting, can be investigated, can vote). */
export const presentIds = (state) => ROBOT_IDS.filter((id) => !isUnplugged(state, id));

/** Robots doing today's task (present and not sitting out). */
export const workingIds = (state) => presentIds(state).filter((id) => !isSittingOut(state, id));

export const innocentPresentIds = (state) => presentIds(state).filter((id) => id !== state.cheaterId);

export const importantKeyCount = (state, id) => state.robots[id].keys.filter(isImportant).length;

export const keyHolder = (state, keyId) => ROBOT_IDS.find((id) => state.robots[id].keys.includes(keyId)) ?? null;

export function newId(state, prefix) {
  state.nextId += 1;
  return `${prefix}${state.nextId}`;
}

/** Record a hidden cheater action for the WHAT WENT WRONG? timeline. */
export function logHidden(state, concept, text, extra = {}) {
  state.hiddenLog.push({
    day: state.day,
    concept,
    conceptLabel: conceptLabel(concept),
    note: extra.note ?? conceptNote(concept),
    text,
    ...(extra.kind ? { kind: extra.kind } : {}),
  });
}

/** Public event feed (things the player saw happen). */
export function logPublic(state, text) {
  state.publicLog.push({ day: state.day, text });
}

export function say(state, speaker, text, kind = 'line') {
  state.meeting.transcript.push({ speaker, text, kind });
}

export function addSuspicion(state, observer, target, amount) {
  if (observer === target) return;
  const row = state.suspicion[observer];
  row[target] = clamp(row[target] + amount, 0, 100);
}

/** Average suspicion of `target` held by present innocents (excluding target). */
export function avgInnocentSuspicion(state, target) {
  const observers = innocentPresentIds(state).filter((id) => id !== target);
  if (observers.length === 0) return 0;
  return observers.reduce((sum, o) => sum + state.suspicion[o][target], 0) / observers.length;
}

/**
 * Change Home Health with a public reason. Recorded on today's list (getHud().healthChanges)
 * and in state.healthLog for the whole game. Never names the cheater.
 */
export function changeHealth(state, delta, reason) {
  const before = state.homeHealth;
  state.homeHealth = clamp(before + delta, 0, 100);
  const actual = state.homeHealth - before;
  if (actual === 0 && delta < 0) return 0; // already at 0: the game is ending anyway
  if (actual === 0) reason = `${reason} (Home Health was already full.)`;
  const entry = { day: state.day, delta: actual, reason };
  if (state.today) (state.today.healthChanges ??= []).push({ delta: actual, reason });
  (state.healthLog ??= []).push(entry);
  logPublic(state, actual === 0 ? reason : `${reason} Home Health ${actual > 0 ? '+' : '−'}${Math.abs(actual)}%.`);
  return actual;
}

/** Legacy: silent damage with a generic reason. Prefer changeHealth. */
export function damageHome(state, amount, reason = 'Something went wrong in the house.') {
  return changeHealth(state, -amount, reason);
}
