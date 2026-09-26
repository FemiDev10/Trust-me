import { createRng, hashSeed } from './rng.js';
import { ROBOT_IDS } from './data/cast.js';
import { HARMLESS_KEY_IDS } from './data/keys.js';
import { SCENARIOS } from './data/scenarios.js';
import { normaliseLevel } from './data/levels.js';
import { MAX_DAYS, START_HOME_HEALTH, SCENARIOS_PER_GAME, SUSPICION_START_MAX } from './constants.js';

/**
 * Build a fresh game. Everything random is drawn from `seed`, so the same seed
 * and the same actions always produce the same game.
 */
export function createGame({ seed = Date.now(), mode = 'home', level = 1 } = {}) {
  if (mode !== 'home') throw new Error(`Mode "${mode}" is coming soon`);
  const rng = createRng(hashSeed(seed));
  level = normaliseLevel(level);

  const cheaterId = rng.pick(ROBOT_IDS);
  const scenarioIds = rng.shuffle(SCENARIOS.map((s) => s.id)).slice(0, SCENARIOS_PER_GAME);

  // Important keys start with the human. Harmless keys start spread among robots,
  // so the key drawer is never trivially empty.
  const robots = Object.fromEntries(ROBOT_IDS.map((id) => [id, { id, status: 'active', keys: [], sitOutDay: null }]));
  const holders = rng.shuffle(ROBOT_IDS);
  HARMLESS_KEY_IDS.forEach((k, i) => robots[holders[i]].keys.push(k));

  // suspicion[observer][target], 0..100. Starts as light background noise.
  const suspicion = Object.fromEntries(
    ROBOT_IDS.map((o) => [o, Object.fromEntries(ROBOT_IDS.filter((t) => t !== o).map((t) => [t, rng.int(0, SUSPICION_START_MAX)]))]),
  );

  return {
    seed,
    mode,
    level,
    rngState: rng.state,
    phase: 'roleReveal',
    day: 1,
    maxDays: MAX_DAYS,
    homeHealth: START_HOME_HEALTH,
    cheaterId,
    scenarioIds,
    robots,
    suspicion,
    today: null,
    meeting: null,
    evidence: [],
    lastDecision: null,
    selfPreserveUsed: false,
    // The cheater's private model of the player (bots/cheater.js). Hidden from the UI.
    mind: { standIn: [], checks: [], accused: {}, shown: {}, pollVotes: {}, lastImportantAskDay: null },
    hiddenLog: [],
    publicLog: [],
    ending: null,
    lastError: null,
    nextId: 0,
  };
}
