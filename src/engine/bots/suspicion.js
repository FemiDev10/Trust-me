// Robot-to-robot suspicion: who each robot would point at, and the poll.

import { POLL_THRESHOLD, POLL_VOTE_THRESHOLD, POLL_VOTE_ANYWAY_CHANCE } from '../constants.js';
import { presentIds } from '../helpers.js';
import { cheaterPollTarget, cheaterSkipsPoll } from './cheater.js';

/** Highest-suspicion present robot for this observer, or null if under threshold. */
export function topSuspect(state, observer, threshold = POLL_THRESHOLD) {
  let best = null;
  for (const t of presentIds(state)) {
    if (t === observer) continue;
    const v = state.suspicion[observer][t];
    if (v >= threshold && (best === null || v > state.suspicion[observer][best])) best = t;
  }
  return best;
}

/** Each present robot's pick. Innocents follow their suspicion; the cheater frames an innocent. */
/** An innocent's poll vote: its top suspect when mildly suspicious, else sometimes a hunch. */
function innocentVote(state, rng, voterId) {
  const firm = topSuspect(state, voterId, POLL_VOTE_THRESHOLD);
  if (firm) return firm;
  const hunch = topSuspect(state, voterId, 0);
  return hunch && rng?.chance(POLL_VOTE_ANYWAY_CHANCE) ? hunch : null;
}

export function computePoll(state, rng) {
  const ids = presentIds(state);
  const innocentVotes = ids.filter((id) => id !== state.cheaterId).map((voterId) => ({ voterId, targetId: innocentVote(state, rng, voterId) }));
  const cheaterTarget = ids.includes(state.cheaterId) && !cheaterSkipsPoll(state, rng) ? cheaterPollTarget(state, innocentVotes) : null;
  return ids.map((voterId) => (voterId === state.cheaterId ? { voterId, targetId: cheaterTarget } : innocentVotes.find((v) => v.voterId === voterId)));
}
