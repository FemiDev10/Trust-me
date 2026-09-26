import { createGame, step } from '../index.js';

/** Apply actions, failing loudly on any engine error. */
export function run(state, ...actions) {
  let s = state;
  for (const a of actions) {
    s = step(s, a);
    if (s.lastError) throw new Error(`${a.type}: ${s.lastError}`);
  }
  return s;
}

/** New game with a forced cheater (tests only; state is plain data). */
export function gameWithCheater(seed, cheaterId, level = 1) {
  return { ...createGame({ seed, level }), cheaterId };
}

/** From roleReveal/dayEnd to the work phase with rooms assigned. */
export const toWork = (s) => run(s, { type: s.phase === 'dayEnd' ? 'NEXT_DAY' : 'START' }, { type: 'START_WORK' });

/** Stand in a room that is NOT the given robot's (so the cheater is unwatched). */
export function standAwayFrom(s, robotId) {
  const theirs = s.today.assignments[robotId];
  const room = Object.values(s.today.assignments).find((r) => r !== theirs) ?? 'garden';
  return run(s, { type: 'STAND_IN', roomId: room });
}

/** Skip the rest of today up to the decision phase. */
export const toDecision = (s) => {
  if (s.phase === 'work') s = run(s, { type: 'START_INVESTIGATION' });
  if (s.phase === 'investigate') s = run(s, { type: 'CALL_MEETING' });
  return run(s, { type: 'END_MEETING' });
};

export const innocentOf = (s) => Object.keys(s.robots).find((id) => id !== s.cheaterId && s.robots[id].status !== 'unplugged');
