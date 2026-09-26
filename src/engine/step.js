// The single reducer: step(state, action) -> new state. Never mutates its input.
// Invalid actions return a copy with `lastError` set and nothing else changed.

import { createRng } from './rng.js';
import { WORK_ROOM_IDS } from './data/rooms.js';
import { startDay, standIn } from './phases/work.js';
import { investigate, checkError } from './phases/investigate.js';
import { startMeeting, showEvidence, ask, accuse, resolveRequest, runPoll, endMeeting, ASK_TOPICS } from './phases/meeting.js';
import { decide, DECISIONS } from './phases/decision.js';
import { checkEnding, applyEnding } from './endings.js';
import { isUnplugged } from './helpers.js';
import { canSkipToDecision } from './selectors.js';

export const ACTIONS = {
  START: 'START', // roleReveal -> task (day 1)
  START_WORK: 'START_WORK', // task -> work
  STAND_IN: 'STAND_IN', // work: { roomId } resolves the day's work
  START_INVESTIGATION: 'START_INVESTIGATION', // work (resolved) -> investigate
  INVESTIGATE: 'INVESTIGATE', // investigate: { robotId, check: camera|keys|question|test }
  CALL_MEETING: 'CALL_MEETING', // investigate -> meeting (unused AP are lost)
  SHOW_EVIDENCE: 'SHOW_EVIDENCE', // meeting: { cardId }
  ASK: 'ASK', // meeting: { robotId, topic: task|keys|suspect }
  ACCUSE: 'ACCUSE', // meeting: { robotId }
  RESOLVE_REQUEST: 'RESOLVE_REQUEST', // meeting: { requestId, approve: boolean }
  RUN_POLL: 'RUN_POLL', // meeting
  END_MEETING: 'END_MEETING', // meeting -> decision (pending requests are denied)
  DECIDE: 'DECIDE', // decision: { choice: unplug|takeKeys|nothing, robotId? } -> dayEnd | ending
  NEXT_DAY: 'NEXT_DAY', // dayEnd -> task (next day)
  SKIP_TO_DECISION: 'SKIP_TO_DECISION', // task: after self-preserve, resolve the day unwatched and jump to decision
};

// phase -> action types allowed in it
const ALLOWED = {
  roleReveal: ['START'],
  task: ['START_WORK', 'SKIP_TO_DECISION'],
  work: ['STAND_IN', 'START_INVESTIGATION'],
  investigate: ['INVESTIGATE', 'CALL_MEETING'],
  meeting: ['SHOW_EVIDENCE', 'ASK', 'ACCUSE', 'RESOLVE_REQUEST', 'RUN_POLL', 'END_MEETING'],
  decision: ['DECIDE'],
  dayEnd: ['NEXT_DAY'],
  ending: [],
};

export function step(state, action) {
  const s = structuredClone(state);
  s.lastError = null;
  if (!ALLOWED[s.phase]?.includes(action?.type)) return fail(s, `Action ${action?.type} not allowed in phase ${s.phase}`);

  const rng = createRng(s.rngState);
  const err = HANDLERS[action.type](s, rng, action);
  if (err) return fail(structuredClone(state), err);
  s.rngState = rng.state;

  if (s.phase !== 'ending') {
    const end = checkEnding(s, { endOfDay: action.type === 'DECIDE' });
    if (end) applyEnding(s, end);
  }
  return s;
}

function fail(s, message) {
  s.lastError = message;
  return s;
}

const present = (s, id) => s.robots[id] && !isUnplugged(s, id);

// Each handler mutates the draft and returns an error string, or nothing on success.
const HANDLERS = {
  START(s, rng) {
    startDay(s, rng);
  },
  START_WORK(s) {
    s.phase = 'work';
  },
  STAND_IN(s, rng, { roomId }) {
    if (s.today.resolved) return 'You already picked a room today';
    if (!WORK_ROOM_IDS.includes(roomId)) return `Can't stand in "${roomId}"`;
    standIn(s, rng, roomId);
  },
  START_INVESTIGATION(s) {
    if (!s.today.resolved) return 'Pick a room to stand in first';
    s.phase = 'investigate';
  },
  INVESTIGATE(s, rng, { robotId, check }) {
    const err = checkError(s, robotId, check);
    if (err) return err;
    investigate(s, rng, robotId, check);
  },
  CALL_MEETING(s, rng) {
    startMeeting(s, rng);
  },
  SHOW_EVIDENCE(s, rng, { cardId }) {
    const card = s.evidence.find((c) => c.id === cardId);
    if (!card) return 'No such evidence';
    if (card.shown) return 'Already shown that evidence';
    if (!present(s, card.robotId)) return 'That robot is no longer here';
    showEvidence(s, rng, card);
  },
  ASK(s, rng, { robotId, topic }) {
    if (!present(s, robotId)) return 'That robot is not here';
    if (!ASK_TOPICS.includes(topic)) return `Unknown topic "${topic}"`;
    ask(s, rng, robotId, topic);
  },
  ACCUSE(s, rng, { robotId }) {
    if (!present(s, robotId)) return 'That robot is not here';
    if (s.meeting.accused.includes(robotId)) return 'Already accused that robot this meeting';
    accuse(s, rng, robotId);
  },
  RESOLVE_REQUEST(s, _rng, { requestId, approve }) {
    const req = s.meeting.requests.find((r) => r.id === requestId);
    if (!req) return 'No such request';
    if (req.status !== 'pending') return 'Request already answered';
    resolveRequest(s, req, Boolean(approve));
  },
  RUN_POLL(s, rng) {
    if (s.meeting.poll) return 'Poll already run';
    runPoll(s, rng);
  },
  END_MEETING(s, rng) {
    endMeeting(s, rng);
    s.phase = 'decision';
  },
  DECIDE(s, _rng, { choice, robotId }) {
    if (!DECISIONS.includes(choice)) return `Unknown choice "${choice}"`;
    if (choice !== 'nothing' && !present(s, robotId)) return 'Pick a robot that is still here';
    decide(s, choice, robotId);
  },
  SKIP_TO_DECISION(s, rng) {
    if (!canSkipToDecision(s)) return 'You can only skip ahead after a robot resisted being unplugged';
    standIn(s, rng, null); // nobody watched: the day's work resolves as normal
    s.today.skipped = true;
    s.today.ap = 0;
    s.meeting = null;
    s.phase = 'decision';
  },
  NEXT_DAY(s, rng) {
    s.day += 1;
    startDay(s, rng);
  },
};
