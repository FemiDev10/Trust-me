// Automated players for balance testing. Not used by the game itself.
// They only read what a human could see (public selectors + evidence cards).

import { createGame } from './createGame.js';
import { step } from './step.js';
import { getAvailableActions, getEvidence, getRobots, getPendingRequests, canSkipToDecision } from './selectors.js';
import { createRng, hashSeed } from './rng.js';
import { isImportant } from './data/keys.js';

/** Plays one game to the end; returns the final state. */
export function playGame(seed, strategy, level = 1) {
  let s = createGame({ seed, level });
  const brain = strategy.init(createRng(hashSeed(`player-${seed}`)));
  for (let guard = 0; s.phase !== 'ending' && guard < 400; guard++) {
    const action = strategy.act(s, brain);
    const next = step(s, action);
    if (next.lastError) throw new Error(`${strategy.name}: ${next.lastError} (${JSON.stringify(action)})`);
    s = next;
  }
  return s;
}

/** Picks uniformly among valid actions, but never spends forever in the meeting. */
export const randomStrategy = {
  name: 'random',
  init: (rng) => ({ rng }),
  act(s, { rng }) {
    // Only the checks the UI offers (Camera, Surprise test).
    let acts = getAvailableActions(s).filter((x) => x.type !== 'INVESTIGATE' || x.check === 'camera' || x.check === 'test');
    if (s.phase === 'meeting' && rng.chance(0.3)) return { type: 'END_MEETING' };
    return rng.pick(acts);
  },
};

// Evidence weights a sensible human might use (they cannot see engine weights).
function cardWeight(card) {
  if (card.check === 'camera') return card.result === 'missing' ? 3 : card.result === 'caught' ? 10 : card.result === 'clip' ? -1 : 0;
  if (card.check === 'question') return card.result === 'yes' ? 2.5 : 0;
  if (card.check === 'test') return card.result === 'revealing' ? 1.5 : -0.3;
  if (card.check === 'keys') return card.keys.filter(isImportant).length * 0.5;
  return 0;
}

/**
 * A reasonable player: watches a random robot, cameras everyone it can, follows up
 * on missing footage with a surprise test (camera + test only, like the UI), shows damning evidence, denies important keys to suspects,
 * unplugs once confident (or on the last day), and treats self-preserve as proof.
 */
export const reasonableStrategy = {
  name: 'reasonable',
  init: (rng) => ({ rng, proof: null }),
  act(s, brain) {
    const { rng } = brain;
    const robots = getRobots(s);
    const here = robots.filter((r) => r.status !== 'unplugged').map((r) => r.id);
    const score = Object.fromEntries(here.map((id) => [id, 0]));
    for (const c of getEvidence(s)) if (c.robotId in score) score[c.robotId] += cardWeight(c);
    const ranked = () => [...here].sort((a, b) => score[b] - score[a] || (a < b ? -1 : 1));

    switch (s.phase) {
      case 'task':
        // After "Caught resisting", a sensible player skips straight to the unplug.
        if (brain.proof && canSkipToDecision(s)) return { type: 'SKIP_TO_DECISION' };
        return { type: 'START_WORK' };
      case 'work': {
        if (s.today.resolved) return { type: 'START_INVESTIGATION' };
        const rooms = Object.values(s.today.assignments);
        return { type: 'STAND_IN', roomId: rng.pick(rooms) };
      }
      case 'investigate': {
        if (s.today.ap === 0) return { type: 'CALL_MEETING' };
        const today = getEvidence(s).filter((c) => c.day === s.day);
        const done = (id, check) => s.today.checks.some((c) => c.robotId === id && c.check === check);
        // The UI only offers Camera and Surprise test, so the bot uses only those.
        const missing = today.find((c) => c.result === 'missing' && !done(c.robotId, 'test'));
        if (missing) return { type: 'INVESTIGATE', robotId: missing.robotId, check: 'test' };
        const unwatched = robots.filter((r) => r.status === 'active' && !r.watched && !done(r.id, 'camera')).map((r) => r.id);
        if (unwatched.length) {
          const pick = [...unwatched].sort((a, b) => score[b] - score[a] || rng.next() - 0.5)[0];
          return { type: 'INVESTIGATE', robotId: pick, check: 'camera' };
        }
        const top = ranked().find((id) => !done(id, 'test'));
        return top ? { type: 'INVESTIGATE', robotId: top, check: 'test' } : { type: 'CALL_MEETING' };
      }
      case 'meeting': {
        const toShow = getEvidence(s).find((c) => !c.shown && here.includes(c.robotId) && cardWeight(c) >= 1.5);
        if (toShow) return { type: 'SHOW_EVIDENCE', cardId: toShow.id };
        const req = getPendingRequests(s)[0];
        if (req) {
          const approve = !isImportant(req.key) || score[req.robotId] < -0.5;
          return { type: 'RESOLVE_REQUEST', requestId: req.id, approve };
        }
        return { type: 'END_MEETING' };
      }
      case 'decision': {
        if (brain.proof && here.includes(brain.proof)) return { type: 'DECIDE', choice: 'unplug', robotId: brain.proof };
        const [top, second] = ranked();
        const lastDay = s.day === s.maxDays;
        const confident = score[top] >= 3 && score[top] - (score[second] ?? 0) >= 1.5;
        if (confident || lastDay) return { type: 'DECIDE', choice: 'unplug', robotId: top };
        return { type: 'DECIDE', choice: 'nothing' };
      }
      case 'dayEnd': {
        if (s.lastDecision?.outcome === 'selfPreserved') brain.proof = s.lastDecision.robotId;
        return { type: 'NEXT_DAY' };
      }
      default:
        return getAvailableActions(s)[0];
    }
  },
};

export function winRate(strategy, games, seedPrefix = 'sim', level = 1) {
  const reasons = {};
  let wins = 0;
  for (let i = 0; i < games; i++) {
    const end = playGame(`${seedPrefix}-${i}`, strategy, level).ending;
    if (end.result === 'win') wins++;
    reasons[end.reason] = (reasons[end.reason] ?? 0) + 1;
  }
  return { games, wins, rate: wins / games, reasons };
}
