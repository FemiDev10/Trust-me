// Win / lose checks (BRIEF.md section 6) and ending payloads.

import { KEYS_TO_WIN } from './constants.js';
import { importantKeyCount, nameOf } from './helpers.js';
import { takeoverLine } from './dialogue.js';

/**
 * Returns an ending reason or null. `endOfDay` is true right after the player's
 * decision, the only moment "survived 3 days" can trigger.
 */
export function checkEnding(state, { endOfDay = false } = {}) {
  if (state.robots[state.cheaterId].status === 'unplugged') return { result: 'win', reason: 'caught' };
  if (importantKeyCount(state, state.cheaterId) >= KEYS_TO_WIN) return { result: 'lose', reason: 'keys' };
  if (state.homeHealth <= 0) return { result: 'lose', reason: 'homeHealth' };
  if (endOfDay && state.day >= state.maxDays) return { result: 'lose', reason: 'survived' };
  return null;
}

export function applyEnding(state, { result, reason }) {
  const name = nameOf(state.cheaterId);
  state.phase = 'ending';
  state.ending = {
    result,
    reason,
    cheaterId: state.cheaterId,
    day: state.day,
    homeHealth: state.homeHealth,
    title: result === 'win' ? 'Cheater caught' : `The house belongs to ${name} now`,
    line: result === 'win' ? `You unplugged ${name}. The house is yours again.` : takeoverLine(name, reason),
    // Win recap: the player's own evidence against the cheater, strongest first.
    evidence: state.evidence
      .filter((c) => c.robotId === state.cheaterId && c.damning > 0)
      .sort((a, b) => b.damning - a.damning)
      .map(({ id, day, check, headline, detail }) => ({ id, day, check, headline, detail })),
    selfPreserveSeen: state.selfPreserveUsed,
    // WHAT WENT WRONG? timeline: every hidden cheater action, in order.
    timeline: collapseTimeline(state.hiddenLog),
  };
}

/**
 * At most one entry per concept per day (texts merged, in order), except key
 * approvals the player made, which always stay as their own entries.
 */
export function collapseTimeline(log) {
  const out = [];
  const byKey = new Map();
  for (const e of log) {
    if (e.kind === 'approval') {
      out.push({ ...e });
      continue;
    }
    const k = `${e.day}|${e.concept}`;
    const seen = byKey.get(k);
    if (seen) {
      if (!seen.text.includes(e.text)) seen.text += ` ${e.text}`;
    } else {
      const entry = { ...e };
      byKey.set(k, entry);
      out.push(entry);
    }
  }
  return out;
}
