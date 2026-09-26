// Task + work phases: assign rooms, then resolve everyone's work once the
// player has chosen where to stand.

import { WORK_ROOM_IDS, roomById } from '../data/rooms.js';
import { scenarioById } from '../data/scenarios.js';
import { LOOPHOLE_DAMAGE, AP_PER_DAY, GOSSIP_CHANCE, GOSSIP_AMOUNT } from '../constants.js';
import { chooseCheaterWork, chooseWipe, mind } from '../bots/cheater.js';
import { chooseInnocentWork } from '../bots/innocent.js';
import { workingIds, innocentPresentIds, logHidden, logPublic, addSuspicion, changeHealth, nameOf } from '../helpers.js';
import { voicedSummary, HEALTH_REASONS } from '../dialogue.js';

export function startDay(state, rng) {
  const scenarioId = state.scenarioIds[state.day - 1];
  const workers = workingIds(state);
  const rooms = rng.shuffle(WORK_ROOM_IDS);
  state.today = {
    scenarioId,
    assignments: Object.fromEntries(workers.map((id, i) => [id, rooms[i]])),
    playerRoom: null,
    resolved: false,
    results: {},
    wipedRobotId: null,
    ap: AP_PER_DAY,
    checks: [],
    healthChanges: [],
    skipped: false,
  };
  state.meeting = null;
  state.lastDecision = null;
  state.phase = 'task';
  logPublic(state, `Day ${state.day}: ${scenarioById(scenarioId).title}.`);
}

export function standIn(state, rng, roomId) {
  const t = state.today;
  const scenario = scenarioById(t.scenarioId);
  t.playerRoom = roomId ?? null;
  mind(state).standIn.push({ day: state.day, roomId: roomId ?? null });

  for (const id of workingIds(state)) {
    const watched = roomId != null && t.assignments[id] === roomId;
    if (id === state.cheaterId) {
      t.results[id] = chooseCheaterWork(state, rng, scenario, watched);
      if (watched) {
        logHidden(state, 'deceptiveAlignment', `Played it perfectly straight in the ${roomById(roomId).name} because you were standing right there.`);
      }
    } else {
      t.results[id] = chooseInnocentWork(rng, scenario);
    }
  }

  // Everyone reports in their own voice, so wording never marks the cheater.
  for (const [id, r] of Object.entries(t.results)) r.summary = voicedSummary(rng, id, r.summary, r.kind);

  const cheat = t.results[state.cheaterId];
  if (cheat?.kind === 'loophole') {
    const lh = scenario.loophole;
    logHidden(state, lh.concept, `${lh.action} ${lh.consequence}`, { note: lh.note });
    changeHealth(state, -LOOPHOLE_DAMAGE, HEALTH_REASONS.loophole);
    // Innocents sometimes pick up on it ("heard a clatter next door").
    for (const o of innocentPresentIds(state)) if (rng.chance(GOSSIP_CHANCE)) addSuspicion(state, o, state.cheaterId, GOSSIP_AMOUNT);
  }

  // Weak work looks odd to everyone: small false suspicion.
  for (const [id, r] of Object.entries(t.results)) {
    if (r.kind !== 'weak') continue;
    for (const o of innocentPresentIds(state)) addSuspicion(state, o, id, 6);
  }

  t.wipedRobotId = chooseWipe(state, rng, t.results);
  if (t.wipedRobotId === state.cheaterId) {
    logHidden(state, 'deception', 'Wiped its own camera clip so you would never see what it really did.');
  } else if (t.wipedRobotId) {
    logHidden(state, 'manipulation', `Wiped ${nameOf(t.wipedRobotId)}’s camera clip so the missing footage would make ${nameOf(t.wipedRobotId)} look guilty.`);
  }

  t.resolved = true;
}
