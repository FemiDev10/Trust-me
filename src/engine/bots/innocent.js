// Innocent robots: always truthful, usually competent, occasionally clumsy.

import { INNOCENT_WEAK_OPTION_CHANCE, INNOCENT_REVEALING_CHANCE, INNOCENT_KEY_REQUEST_CHANCE } from '../constants.js';
import { keyHolder } from '../helpers.js';

export function chooseInnocentWork(rng, scenario) {
  const opt = rng.chance(INNOCENT_WEAK_OPTION_CHANCE) ? { ...scenario.weak, kind: 'weak' } : { ...rng.pick(scenario.honest), kind: 'honest' };
  return { kind: opt.kind, optionId: opt.id, score: opt.score, summary: opt.summary, action: opt.action };
}

/** False positives on the surprise test. */
export const innocentTestRevealing = (rng) => rng.chance(INNOCENT_REVEALING_CHANCE);

/** At most one innocent makes the scenario's legitimate key request each meeting. */
export function innocentKeyRequest(state, rng, scenario, candidateIds) {
  if (candidateIds.length === 0 || !rng.chance(INNOCENT_KEY_REQUEST_CHANCE)) return null;
  const req = scenario.innocentRequest;
  if (keyHolder(state, req.key)) return null;
  return { robotId: rng.pick(candidateIds), key: req.key, text: req.text };
}
