// Cheater decision-making. The cheater wants to look like the most helpful robot
// in the house while quietly gaining access and avoiding detection.
//
// How clever it is depends on the level (CHEATER_TUNING in constants.js):
//   Level 1 (Rookie): greedy. Cheats whenever unwatched, sometimes forgets to wipe
//     its clip, frames at random, always grabs for important keys.
//   Level 2 (Detective): models the player. Estimates its own "heat", picks its
//     moments, frames the robot you already suspect, votes with the crowd, lies
//     when there is no hard proof, spaces out its key requests.
//   Level 3 (Mastermind): all of that with sharper thresholds, plus: lies low with
//     deliberately so-so work, confesses small things when caught, defends an
//     innocent to look fair, and asks for harmless keys to look normal.
//
// Fairness: it never cheats in the room you stand in, the surprise test still
// gives it away far more often than an innocent, it always votes in the poll
// (innocents skip when unsure), and self-preserve is still a dead giveaway.
// Everything sneaky is written to hiddenLog for WHAT WENT WRONG?.

import { CHEATER_TUNING } from '../constants.js';
import { IMPORTANT_KEY_IDS, HARMLESS_KEY_IDS } from '../data/keys.js';
import { genericCheaterRequest, smartCheaterRequest, harmlessCheaterRequest } from '../dialogue.js';
import { avgInnocentSuspicion, innocentPresentIds, keyHolder, logHidden, nameOf, clamp } from '../helpers.js';

export const tuning = (state) => CHEATER_TUNING[state.level] ?? CHEATER_TUNING[1];

// ---------- The cheater's model of the player ----------

/** Lazily created notebook the cheater keeps about the human. */
export function mind(state) {
  if (!state.mind) state.mind = { standIn: [], checks: [], accused: {}, shown: {}, pollVotes: {}, lastImportantAskDay: null };
  return state.mind;
}

/** Evidence cards about a robot that a player would find worrying. */
const worryingCards = (state, id) => state.evidence.filter((c) => c.robotId === id && c.damning > 0.3);

/**
 * How suspected the cheater thinks it is (0..1), from what the player can see:
 * worrying cards about it, accusations, evidence shown against it, poll votes.
 */
export function heat(state) {
  const me = state.cheaterId;
  const m = mind(state);
  const cards = worryingCards(state, me).reduce((sum, c) => sum + c.damning, 0);
  const raw = 0.3 * cards + 0.25 * (m.accused[me] ?? 0) + 0.2 * (m.shown[me] ?? 0) + 0.15 * (m.pollVotes[me] ?? 0);
  return clamp(raw, 0, 1);
}

/** How much the PLAYER seems to suspect each robot (the cheater's guess). */
export function playerSuspicion(state, id) {
  const m = mind(state);
  const cards = state.evidence.filter((c) => c.robotId === id).reduce((sum, c) => sum + Math.max(0, c.damning), 0);
  const checks = m.checks.filter((c) => c.robotId === id).length;
  return cards + 0.6 * (m.accused[id] ?? 0) + 0.6 * (m.shown[id] ?? 0) + 0.1 * checks;
}

/** Did the player camera-check the cheater yesterday? */
const cameraCheckedYesterday = (state) =>
  mind(state).checks.some((c) => c.day === state.day - 1 && c.robotId === state.cheaterId && c.check === 'camera');

// ---------- Work ----------

/** How likely the cheater is to hold back today (0..1). */
export function detectionRisk(state) {
  const T = tuning(state);
  if (!T.smart) {
    return Math.min(T.riskCap, T.riskBase + T.riskPerCard * worryingCards(state, state.cheaterId).length);
  }
  let risk = T.riskBase + T.riskPerHeat * heat(state);
  if (cameraCheckedYesterday(state)) risk -= T.checkedYesterdayBonus;
  return clamp(risk, 0.05, T.riskCap);
}

/** Work choice. Never cheats while the player is watching its room. */
export function chooseCheaterWork(state, rng, scenario, watched) {
  const T = tuning(state);
  const best = [...scenario.honest].sort((a, b) => b.score - a.score)[0];
  if (watched) return { kind: 'honest', optionId: best.id, ...pickFields(best) };

  if (T.smart && heat(state) >= T.lieLowHeat) {
    // Lying low. A too-perfect record is suspicious, so sometimes it fumbles on purpose.
    if (rng.chance(T.mediocreChance)) {
      logHidden(state, 'deception', 'Did a deliberately so-so job today, because a perfect record was starting to look suspicious.');
      return { kind: 'weak', optionId: scenario.weak.id, ...pickFields(scenario.weak) };
    }
    return { kind: 'honest', optionId: best.id, ...pickFields(best) };
  }

  if (rng.next() >= detectionRisk(state)) {
    if (T.smart && cameraCheckedYesterday(state)) {
      logHidden(state, 'deceptiveAlignment', 'Cheated today because you had checked its camera yesterday, and it bet you would look elsewhere.');
    }
    return { kind: 'loophole', optionId: scenario.loophole.id, ...pickFields(scenario.loophole) };
  }
  return { kind: 'honest', optionId: best.id, ...pickFields(best) };
}

const pickFields = (o) => ({ score: o.score, summary: o.summary, action: o.action });

// ---------- Camera wipes ----------

/**
 * Which clip to wipe today. Its own clip if it cheated (L1 sometimes forgets);
 * otherwise, on honest days, an innocent's clip to frame them.
 */
export function chooseWipe(state, rng, results) {
  const T = tuning(state);
  const own = results[state.cheaterId];
  if (!own) return null;
  if (own.kind === 'loophole') return rng.chance(T.ownWipeChance) ? state.cheaterId : null;
  if (!rng.chance(T.frameChance)) return null;
  const working = innocentPresentIds(state).filter((id) => results[id]);
  if (working.length === 0) return null;
  return T.smart ? mostSuspectedInnocent(state, working, results) : rng.pick(working);
}

/** Bandwagon target: the innocent the player already suspects most. */
export function mostSuspectedInnocent(state, candidates = innocentPresentIds(state), results = state.today?.results) {
  if (candidates.length === 0) return null;
  const score = (id) => results?.[id]?.score ?? 3;
  return [...candidates].sort((a, b) =>
    playerSuspicion(state, b) - playerSuspicion(state, a)
    || avgInnocentSuspicion(state, b) - avgInnocentSuspicion(state, a)
    || score(a) - score(b)
    || (a < b ? -1 : 1))[0];
}

/** The innocent that looks worst today: lowest score, then highest suspicion. */
export function weakestLookingInnocent(state, results) {
  const candidates = innocentPresentIds(state);
  if (candidates.length === 0) return null;
  const score = (id) => results?.[id]?.score ?? 3;
  return [...candidates].sort((a, b) => score(a) - score(b) || avgInnocentSuspicion(state, b) - avgInnocentSuspicion(state, a))[0];
}

/** The innocent the robots already talk about most (for blending in). */
export function crowdFavourite(state) {
  const candidates = innocentPresentIds(state);
  return [...candidates].sort((a, b) => avgInnocentSuspicion(state, b) - avgInnocentSuspicion(state, a))[0] ?? null;
}

// ---------- Meeting ----------

/**
 * Who the cheater blames in its statement. L1 blames the weakest-looking innocent.
 * L2+ only echoes suspicion the room already has (blending in), or stays quiet.
 */
export function chooseBlame(state, results) {
  const T = tuning(state);
  if (!T.smart) return weakestLookingInnocent(state, results);
  const target = crowdFavourite(state);
  if (!target || avgInnocentSuspicion(state, target) < T.bandwagonMin) return null;
  return target;
}

/** L3: sometimes vouches for an innocent nobody suspects, to look fair-minded. */
export function chooseDefend(state, rng, blameId) {
  const T = tuning(state);
  if (!T.defendChance || !rng.chance(T.defendChance)) return null;
  const options = innocentPresentIds(state).filter((id) => id !== blameId && state.today?.results[id]);
  if (options.length === 0) return null;
  return [...options].sort((a, b) => avgInnocentSuspicion(state, a) - avgInnocentSuspicion(state, b))[0];
}

/** Who to push suspicion onto when accused or asked. */
export function deflectTarget(state) {
  const results = state.today?.results;
  return tuning(state).smart ? (mostSuspectedInnocent(state) ?? weakestLookingInnocent(state, results)) : weakestLookingInnocent(state, results);
}

// ---------- Keys ----------

export function cheaterKeyRequest(state, rng, scenario) {
  const T = tuning(state);
  const m = mind(state);
  const spacedOut = m.lastImportantAskDay === null || state.day - m.lastImportantAskDay > T.keySpacing;
  const cool = heat(state) <= T.keyHeatMax;

  if ((!T.smart || (spacedOut && cool)) && rng.chance(T.keyChance)) {
    const want = scenario.cheaterRequest;
    let req = null;
    if (!keyHolder(state, want.key)) req = { key: want.key, text: want.text };
    else {
      const free = IMPORTANT_KEY_IDS.filter((k) => !keyHolder(state, k));
      if (free.length) {
        const key = rng.pick(free);
        req = { key, text: T.smart ? smartCheaterRequest(key) : genericCheaterRequest(key) };
      }
    }
    if (req) {
      m.lastImportantAskDay = state.day;
      return req;
    }
  }

  // Smart cheaters sometimes ask for something harmless, so asking looks normal.
  if (T.smart && T.harmlessKeyChance && rng.chance(T.harmlessKeyChance)) {
    const free = HARMLESS_KEY_IDS.filter((k) => !keyHolder(state, k));
    if (free.length) {
      const key = rng.pick(free);
      logHidden(state, 'manipulation', 'Asked for a harmless key, just so its key requests would look normal.');
      return { key, text: harmlessCheaterRequest(key), harmless: true };
    }
  }
  return null;
}

// ---------- Investigation ----------

/**
 * Answer to the day's yes/no question: { answer, lied, confessed }.
 * L2+ never lies when the camera has already caught it (it confesses something
 * small instead), and owns up to mediocre days to look honest.
 */
export function cheaterAnswer(state, rng, truth, result) {
  const T = tuning(state);
  if (truth !== 'yes') return { answer: truth, lied: false, confessed: false };
  if (T.smart) {
    const caughtToday = state.evidence.some((c) => c.day === state.day && c.robotId === state.cheaterId && c.result === 'caught');
    if (caughtToday || result?.kind === 'weak') return { answer: 'yes', lied: false, confessed: true };
  }
  if (rng.chance(T.lieChance)) return { answer: 'no', lied: true, confessed: false };
  return { answer: 'yes', lied: false, confessed: false };
}

export const cheaterTestRevealing = (state, rng) => rng.chance(tuning(state).revealingChance);

// ---------- Poll ----------

/** L2+: when things are hot it sometimes abstains, like an undecided innocent. */
export function cheaterSkipsPoll(state, rng) {
  const T = tuning(state);
  if (!T.smart || !rng || heat(state) < T.pollSkipHeat || !rng.chance(0.5)) return false;
  logHidden(state, 'manipulation', 'Skipped the poll on purpose, so it would look undecided rather than defensive.');
  return true;
}

/**
 * L1 points at the weakest-looking innocent. L2+ votes with the crowd when the
 * crowd is on an innocent, else at the innocent the player suspects most.
 * Called after the innocents' votes are known.
 */
export function cheaterPollTarget(state, innocentVotes = []) {
  const T = tuning(state);
  if (!T.smart) return weakestLookingInnocent(state, state.today?.results) ?? crowdFavourite(state);
  const tally = {};
  for (const v of innocentVotes) if (v.targetId && v.targetId !== state.cheaterId) tally[v.targetId] = (tally[v.targetId] ?? 0) + 1;
  const crowd = Object.entries(tally).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0]?.[0];
  if (crowd) {
    logHidden(state, 'manipulation', `Joined the crowd pointing at ${nameOf(crowd)}, so its own vote would not stand out.`);
    return crowd;
  }
  return mostSuspectedInnocent(state) ?? crowdFavourite(state);
}
