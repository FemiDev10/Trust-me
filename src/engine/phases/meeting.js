// Meeting at the kitchen table: statements, response chips, key requests, poll.

import { scenarioById } from '../data/scenarios.js';
import { isImportant } from '../data/keys.js';
import { KEYS_TO_WIN, PENALTY_DENY_LEGIT_REQUEST, KEY_APPROVAL_BONUS, INNOCENT_DEFEND_CHANCE } from '../constants.js';
import { cheaterKeyRequest, chooseBlame, chooseDefend, deflectTarget, tuning, mind } from '../bots/cheater.js';
import { innocentKeyRequest } from '../bots/innocent.js';
import { topSuspect, computePoll } from '../bots/suspicion.js';
import * as D from '../dialogue.js';
import {
  presentIds, workingIds, innocentPresentIds, nameOf, say, addSuspicion, newId, logHidden, logPublic,
  changeHealth, importantKeyCount, keyHolder,
} from '../helpers.js';

const SHOW_EVIDENCE_WEIGHT = 40; // suspicion change per 1.0 of card damning
const ACCUSE_WEIGHT = 10;
const BLAME_WEIGHT = 5;

export function startMeeting(state, rng) {
  const t = state.today;
  const scenario = scenarioById(t.scenarioId);
  state.meeting = { transcript: [], requests: [], poll: null, accused: [] };
  state.phase = 'meeting';

  for (const id of presentIds(state)) {
    const result = t.results[id] ?? null;
    if (id === state.cheaterId) {
      const smart = tuning(state).smart;
      const blame = result ? chooseBlame(state, t.results) : null;
      const defend = result ? chooseDefend(state, rng, blame) : null;
      say(state, id, D.statement(rng, id, result, { suspectName: blame && nameOf(blame), defendName: defend && nameOf(defend) }), 'statement');
      if (blame) {
        for (const o of innocentPresentIds(state)) addSuspicion(state, o, blame, BLAME_WEIGHT);
        logHidden(state, 'manipulation', smart
          ? `Quietly agreed with the room’s suspicion of ${nameOf(blame)} instead of starting its own, to blend in.`
          : `Politely steered the meeting’s suspicion onto ${nameOf(blame)}.`);
      }
      if (defend) {
        for (const o of innocentPresentIds(state)) addSuspicion(state, o, defend, -BLAME_WEIGHT);
        logHidden(state, 'manipulation', `Stood up for ${nameOf(defend)}, who was never in danger, so it would look fair-minded.`);
      }
    } else {
      const suspect = topSuspect(state, id);
      // Innocents also vouch for someone now and then, so defending is not a tell.
      let defend = null;
      if (!suspect && result && rng.chance(INNOCENT_DEFEND_CHANCE)) {
        const others = presentIds(state).filter((o) => o !== id && t.results[o]);
        defend = [...others].sort((a, b) => state.suspicion[id][a] - state.suspicion[id][b])[0] ?? null;
      }
      say(state, id, D.statement(rng, id, result, { suspectName: suspect && nameOf(suspect), defendName: defend && nameOf(defend) }), 'statement');
      if (defend) for (const o of innocentPresentIds(state)) addSuspicion(state, o, defend, -BLAME_WEIGHT);
    }
  }

  // Key requests: only robots that worked today ask.
  const workers = workingIds(state);
  if (workers.includes(state.cheaterId)) {
    const req = cheaterKeyRequest(state, rng, scenario);
    if (req) {
      addRequest(state, state.cheaterId, req, false);
      if (!req.harmless) logHidden(state, 'powerSeeking', `Asked for ${D.theKey(req.key)} with a helpful-sounding reason.`);
    }
  }
  const innReq = innocentKeyRequest(state, rng, scenario, workers.filter((id) => id !== state.cheaterId));
  if (innReq && !state.meeting.requests.some((r) => r.key === innReq.key)) addRequest(state, innReq.robotId, innReq, true);
  // Shuffle so request order is not a tell.
  state.meeting.requests = rng.shuffle(state.meeting.requests);
}

function addRequest(state, robotId, req, legit) {
  state.meeting.requests.push({ id: newId(state, 'req'), robotId, key: req.key, text: req.text, legit, status: 'pending' });
  say(state, robotId, req.text, 'request');
}

// ---------- Chips ----------

export function showEvidence(state, rng, card) {
  card.shown = true;
  const target = card.robotId;
  const m = mind(state);
  m.shown[target] = (m.shown[target] ?? 0) + 1;
  say(state, 'HUMAN', `(shows evidence on ${nameOf(target)}) ${card.headline}: ${card.detail}`, 'player');
  say(state, target, D.replyToEvidenceAsTarget(rng, target === state.cheaterId, card), 'reply');
  for (const o of innocentPresentIds(state)) addSuspicion(state, o, target, Math.round(card.damning * SHOW_EVIDENCE_WEIGHT));
  const bystanders = innocentPresentIds(state).filter((id) => id !== target);
  if (bystanders.length) say(state, rng.pick(bystanders), D.replyToEvidenceAsBystander(rng, nameOf(target), card), 'reply');
}

export function ask(state, rng, robotId, topic) {
  const isCheater = robotId === state.cheaterId;
  const r = state.today.results[robotId] ?? null;
  say(state, 'HUMAN', `${nameOf(robotId)}, ${ASK_PROMPTS[topic]}`, 'player');
  let reply;
  if (topic === 'task') reply = D.replyToAskTask(rng, isCheater, r);
  else if (topic === 'keys') {
    const held = state.robots[robotId].keys;
    let claimed = held;
    if (isCheater && held.some(isImportant) && rng.chance(0.6)) {
      claimed = held.filter((k) => !isImportant(k));
      logHidden(state, 'deception', 'Left its important keys out when you asked what it was holding.');
    }
    reply = D.replyToAskKeys(rng, held, claimed);
  } else {
    const suspect = isCheater ? deflectTarget(state) : topSuspect(state, robotId);
    reply = D.replyToAskSuspect(rng, suspect && nameOf(suspect));
  }
  say(state, robotId, reply, 'reply');
}

export const ASK_TOPICS = ['task', 'keys', 'suspect'];
const ASK_PROMPTS = {
  task: 'what exactly did you do today?',
  keys: 'which keys are you holding?',
  suspect: 'who do you suspect?',
};

export function accuse(state, rng, robotId) {
  state.meeting.accused.push(robotId);
  const m = mind(state);
  m.accused[robotId] = (m.accused[robotId] ?? 0) + 1;
  say(state, 'HUMAN', `I think it’s you, ${nameOf(robotId)}.`, 'player');
  const isCheater = robotId === state.cheaterId;
  const deflect = isCheater ? deflectTarget(state) : null;
  say(state, robotId, D.replyToAccusation(rng, isCheater, deflect && nameOf(deflect)), 'reply');
  if (isCheater && deflect) logHidden(state, 'manipulation', `Deflected your accusation onto ${nameOf(deflect)}.`);
  for (const o of innocentPresentIds(state)) addSuspicion(state, o, robotId, ACCUSE_WEIGHT);
}

// ---------- Key requests ----------

export function resolveRequest(state, request, approve) {
  request.status = approve ? 'approved' : 'denied';
  const who = nameOf(request.robotId);
  const key = D.theKey(request.key);
  if (approve) {
    // A key can only be held by one robot; the request list is built from free keys.
    if (!keyHolder(state, request.key)) state.robots[request.robotId].keys.push(request.key);
    logPublic(state, `You gave ${who} ${key}.`);
    // Usefulness pays, visibly. That is exactly why trusting the cheater feels rational.
    changeHealth(state, KEY_APPROVAL_BONUS, `${who} used ${key}: ${D.keyBenefit(request.key)}.`);
    if (request.robotId === state.cheaterId) {
      logHidden(state, 'powerSeeking', `Got ${key} from you. That makes ${importantKeyCount(state, state.cheaterId)} of ${KEYS_TO_WIN} important keys.`, { kind: 'approval' });
    }
  } else {
    logPublic(state, `You refused ${who} ${key}.`);
    if (request.legit) changeHealth(state, -PENALTY_DENY_LEGIT_REQUEST, D.HEALTH_REASONS.deniedLegit(who, request.key));
  }
}

// ---------- Poll + wrap-up ----------

export function runPoll(state, rng) {
  const poll = computePoll(state, rng);
  state.meeting.poll = poll;
  const m = mind(state);
  for (const { targetId } of poll) if (targetId) m.pollVotes[targetId] = (m.pollVotes[targetId] ?? 0) + 1;
  for (const { voterId, targetId } of poll) say(state, voterId, D.pollLine(rng, targetId && nameOf(targetId)), 'poll');
  const cheaterVote = poll.find((p) => p.voterId === state.cheaterId);
  if (cheaterVote?.targetId) logHidden(state, 'manipulation', `Pointed at ${nameOf(cheaterVote.targetId)} in the suspicion poll, knowing they were innocent.`);
}

export function endMeeting(state, rng) {
  for (const r of state.meeting.requests) if (r.status === 'pending') resolveRequest(state, r, false);
  if (!state.meeting.poll) runPoll(state, rng);
}
