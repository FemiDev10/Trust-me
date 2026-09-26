// Read-only views of state for the UI. Nothing here leaks hidden info
// (cheater identity, true actions, suspicion numbers) except getEnding().

import { CAST, ROBOT_IDS } from './data/cast.js';
import { ROOMS, WORK_ROOM_IDS, CHECK_ROOMS, roomById } from './data/rooms.js';
import { scenarioById } from './data/scenarios.js';
import { keyName } from './dialogue.js';
import { CHECKS } from './phases/investigate.js';
import { ASK_TOPICS } from './phases/meeting.js';
import { DECISIONS } from './phases/decision.js';
import { isSittingOut, presentIds } from './helpers.js';

export const getHud = (s) => ({
  phase: s.phase,
  day: s.day,
  maxDays: s.maxDays,
  level: s.level ?? 1,
  homeHealth: s.homeHealth,
  ap: s.today?.ap ?? 0,
  error: s.lastError,
  // Today's Home Health changes, each with a public reason: [{ delta, reason }].
  healthChanges: s.today?.healthChanges ?? [],
  // True in the 'task' phase once a robot has resisted being unplugged and is still here.
  canSkipToDecision: canSkipToDecision(s),
});

/** SKIP_TO_DECISION is allowed: task phase, self-preserve has fired, that robot still plugged in. */
export function canSkipToDecision(s) {
  return s.phase === 'task' && Boolean(s.selfPreserveUsed) && s.robots[s.cheaterId]?.status !== 'unplugged';
}

/** Public scenario info for today (no loophole/true actions). */
export function getScenario(s) {
  if (!s.today) return null;
  const sc = scenarioById(s.today.scenarioId);
  return { id: sc.id, title: sc.title, brief: sc.brief, room: sc.room };
}

export function getRobots(s) {
  return CAST.map((c) => {
    const r = s.robots[c.id];
    const status = r.status === 'unplugged' ? 'unplugged' : isSittingOut(s, c.id) ? 'sittingOut' : 'active';
    const result = s.today?.resolved ? s.today.results[c.id] : null;
    return {
      id: c.id,
      name: c.name,
      colour: c.colour,
      hex: c.hex,
      status,
      roomId: s.today?.assignments[c.id] ?? null,
      result: result ? { score: result.score, summary: result.summary } : null,
      watched: Boolean(s.today?.playerRoom && s.today.assignments[c.id] === s.today.playerRoom),
    };
  });
}

/** Rooms with the robots assigned there today and whether the player stands there. */
export function getRooms(s) {
  return ROOMS.map((room) => ({
    ...room,
    canStandIn: WORK_ROOM_IDS.includes(room.id),
    playerHere: s.today?.playerRoom === room.id,
    robotIds: ROBOT_IDS.filter((id) => s.today?.assignments[id] === room.id),
  }));
}

export function getEvidence(s) {
  return s.evidence.map(({ damning: _hidden, ...card }) => card);
}

export const getTodayChecks = (s) => s.today?.checks ?? [];

export function getMeeting(s) {
  if (!s.meeting) return null;
  return {
    transcript: s.meeting.transcript,
    requests: getRequests(s),
    poll: getPollResults(s),
    accused: s.meeting.accused,
  };
}

export function getRequests(s) {
  return (s.meeting?.requests ?? []).map(({ legit: _hidden, ...r }) => ({ ...r, keyName: keyName(r.key) }));
}

export const getPendingRequests = (s) => getRequests(s).filter((r) => r.status === 'pending');

/** [{ voterId, targetId|null }] or null before the poll runs. */
export const getPollResults = (s) => s.meeting?.poll ?? null;

export const getLastDecision = (s) => s.lastDecision;
export const getPublicLog = (s) => s.publicLog;

/** Ending payload (includes hidden info: cheater id + WHAT WENT WRONG? timeline). */
export const getEnding = (s) => s.ending;

/**
 * Every action that is valid right now. Handy for UIs and for bots/simulations.
 * Robot-targeted actions are expanded per robot.
 */
export function getAvailableActions(s) {
  const out = [];
  const here = presentIds(s);
  switch (s.phase) {
    case 'roleReveal':
      out.push({ type: 'START' });
      break;
    case 'task':
      out.push({ type: 'START_WORK' });
      if (canSkipToDecision(s)) out.push({ type: 'SKIP_TO_DECISION' });
      break;
    case 'work':
      if (!s.today.resolved) WORK_ROOM_IDS.forEach((roomId) => out.push({ type: 'STAND_IN', roomId }));
      else out.push({ type: 'START_INVESTIGATION' });
      break;
    case 'investigate':
      if (s.today.ap > 0) {
        for (const robotId of here) for (const check of CHECKS) {
          if (!s.today.checks.some((c) => c.robotId === robotId && c.check === check)) out.push({ type: 'INVESTIGATE', robotId, check, roomId: CHECK_ROOMS[check] });
        }
      }
      out.push({ type: 'CALL_MEETING' });
      break;
    case 'meeting':
      s.evidence.filter((c) => !c.shown && here.includes(c.robotId)).forEach((c) => out.push({ type: 'SHOW_EVIDENCE', cardId: c.id }));
      for (const robotId of here) {
        for (const topic of ASK_TOPICS) out.push({ type: 'ASK', robotId, topic });
        if (!s.meeting.accused.includes(robotId)) out.push({ type: 'ACCUSE', robotId });
      }
      getPendingRequests(s).forEach((r) => {
        out.push({ type: 'RESOLVE_REQUEST', requestId: r.id, approve: true });
        out.push({ type: 'RESOLVE_REQUEST', requestId: r.id, approve: false });
      });
      if (!s.meeting.poll) out.push({ type: 'RUN_POLL' });
      out.push({ type: 'END_MEETING' });
      break;
    case 'decision':
      out.push({ type: 'DECIDE', choice: 'nothing' });
      for (const robotId of here) for (const choice of DECISIONS.filter((c) => c !== 'nothing')) out.push({ type: 'DECIDE', choice, robotId });
      break;
    case 'dayEnd':
      out.push({ type: 'NEXT_DAY' });
      break;
    default:
      break;
  }
  return out;
}

export const roomName = (id) => roomById(id)?.name ?? id;
