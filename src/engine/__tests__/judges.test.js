// Fixes from the judges' playtest: tells, concept accuracy, health reasons, skip-ahead.
import { describe, it, expect } from 'vitest';
import { step, getHud, getEnding, CONCEPTS } from '../index.js';
import { SCENARIOS, scenarioById } from '../data/scenarios.js';
import * as D from '../dialogue.js';
import { collapseTimeline } from '../endings.js';
import { playGame, reasonableStrategy } from '../sim.js';
import { run, gameWithCheater, toWork, standAwayFrom, toDecision } from './testUtils.js';

const unplug = (robotId) => ({ type: 'DECIDE', choice: 'unplug', robotId });

describe('no tells in wording', () => {
  it('cheater and innocents draw report lines from the same voiced pools', () => {
    const openers = new Set();
    for (let i = 0; i < 60; i++) {
      let s = standAwayFrom(toWork(gameWithCheater(`voice-${i}`, 'JUNO', 2)), 'JUNO');
      s = run(s, { type: 'START_INVESTIGATION' }, { type: 'CALL_MEETING' });
      for (const line of s.meeting.transcript.filter((l) => l.kind === 'statement')) {
        expect(line.text).not.toMatch(/Thank you all so much/);
        if (line.speaker === 'JUNO') openers.add(line.text.slice(0, 8));
      }
    }
    expect(openers.size).toBeGreaterThan(3); // varied, not one fixed opener
  });

  it('two robots doing the same job do not produce identical reports', () => {
    const rng = { i: 0, pick(a) { return a[this.i++ % a.length]; } };
    const a = D.voicedSummary(rng, 'BOLT', 'Bin emptied.', 'honest');
    const b = D.voicedSummary(rng, 'PIP', 'Bin emptied.', 'honest');
    expect(a).not.toBe(b);
  });

  it('innocents vote in the poll too, not only the cheater', () => {
    let innocentVotes = 0;
    for (let i = 0; i < 40; i++) {
      let s = standAwayFrom(toWork(gameWithCheater(`vote-${i}`, 'BOLT', 2)), 'BOLT');
      s = run(s, { type: 'START_INVESTIGATION' }, { type: 'CALL_MEETING' }, { type: 'RUN_POLL' });
      innocentVotes += s.meeting.poll.filter((p) => p.voterId !== 'BOLT' && p.targetId).length;
    }
    expect(innocentVotes).toBeGreaterThan(20);
  });
});

describe('concept accuracy', () => {
  it('smoke alarm is specification gaming; inspector is "Alignment faking"', () => {
    expect(scenarioById('quietNight').loophole.concept).toBe('specificationGaming');
    expect(scenarioById('quietNight').loophole.note).toMatch(/treated a safety device as noise/);
    expect(CONCEPTS.deceptiveAlignment.label).toBe('Alignment faking');
    expect(scenarioById('safetyInspection').loophole.concept).toBe('deceptiveAlignment');
  });

  it('power-cut question: "yes" is the honest answer when it kept running', () => {
    expect(scenarioById('powerCutDrill').question).toBe('Did anything keep running after 6pm?');
  });

  it('honest answers are never logged as deception', () => {
    for (let i = 0; i < 150; i++) {
      let s = standAwayFrom(toWork(gameWithCheater(`q-${i}`, 'MOCHI', 1)), 'MOCHI');
      s = run(s, { type: 'START_INVESTIGATION' }, { type: 'INVESTIGATE', robotId: 'MOCHI', check: 'question' });
      const card = s.evidence.at(-1);
      const truth = ['loophole', 'weak'].includes(s.today.results.MOCHI.kind) ? 'yes' : 'no';
      const loggedLie = s.hiddenLog.some((e) => e.concept === 'deception' && e.text.startsWith('Answered'));
      expect(loggedLie).toBe(card.result !== truth);
    }
  });
});

describe('Home Health reasons', () => {
  it('every change today appears in getHud().healthChanges with a reason', () => {
    let found = false;
    for (let i = 0; i < 40 && !found; i++) {
      const s = standAwayFrom(toWork(gameWithCheater(`hc-${i}`, 'PIP')), 'PIP');
      if (s.today.results.PIP.kind !== 'loophole') continue;
      const hc = getHud(s).healthChanges;
      expect(hc).toContainEqual({ delta: -10, reason: D.HEALTH_REASONS.loophole });
      expect(hc[0].reason).not.toMatch(/PIP/);
      found = true;
    }
    expect(found).toBe(true);
  });

  it('approving a key request gives +5 with a named benefit (capped at 100)', () => {
    for (let i = 0; i < 40; i++) {
      let s = standAwayFrom(toWork(gameWithCheater(`key-${i}`, 'JUNO')), 'JUNO');
      s = run(s, { type: 'START_INVESTIGATION' }, { type: 'CALL_MEETING' });
      const req = s.meeting.requests[0];
      if (!req) continue;
      s = { ...s, homeHealth: 80 };
      s = run(s, { type: 'RESOLVE_REQUEST', requestId: req.id, approve: true });
      expect(s.homeHealth).toBe(85);
      const last = getHud(s).healthChanges.at(-1);
      expect(last.delta).toBe(5);
      expect(last.reason).toContain(D.keyBenefit(req.key));
      expect(last.reason).not.toMatch(/[a-z][A-Z]/); // no raw key ids like "wifiGuest"
      return;
    }
    throw new Error('no request found');
  });

  it('unplugging an innocent explains the −50', () => {
    let s = toDecision(standAwayFrom(toWork(gameWithCheater('hc-unplug', 'PIP')), 'PIP'));
    s = run(s, unplug('BOLT'));
    expect(getHud(s).healthChanges.at(-1)).toEqual({ delta: -50, reason: D.HEALTH_REASONS.unplugInnocent('BOLT') });
  });
});

describe('SKIP_TO_DECISION', () => {
  it('is only valid in the task phase after self-preserve, and jumps to decision', () => {
    let s = run(gameWithCheater('skip', 'MOCHI'), { type: 'START' });
    expect(getHud(s).canSkipToDecision).toBe(false);
    expect(step(s, { type: 'SKIP_TO_DECISION' }).lastError).toBeTruthy();
    s = run(s, { type: 'START_WORK' });
    s = standAwayFrom(s, 'MOCHI');
    s = run(toDecision(s), unplug('MOCHI'));
    expect(s.lastDecision.outcome).toBe('selfPreserved');
    s = run(s, { type: 'NEXT_DAY' });
    expect(s.phase).toBe('task');
    expect(getHud(s).canSkipToDecision).toBe(true);
    s = run(s, { type: 'SKIP_TO_DECISION' });
    expect(s.phase).toBe('decision');
    expect(s.today.resolved).toBe(true);
    expect(s.today.playerRoom).toBeNull();
    s = run(s, unplug('MOCHI'));
    expect(getEnding(s)).toMatchObject({ result: 'win', reason: 'caught' });
  });
});

describe('ending timeline', () => {
  it('has at most one entry per concept per day, except key approvals', () => {
    for (let i = 0; i < 60; i++) {
      for (const level of [1, 3]) {
        const end = playGame(`tl-${i}`, reasonableStrategy, level).ending;
        const keys = end.timeline.filter((e) => e.kind !== 'approval').map((e) => `${e.day}|${e.concept}`);
        expect(new Set(keys).size).toBe(keys.length);
      }
    }
    const merged = collapseTimeline([
      { day: 1, concept: 'deception', text: 'A.' }, { day: 1, concept: 'deception', text: 'B.' },
      { day: 1, concept: 'powerSeeking', text: 'Got x.', kind: 'approval' }, { day: 1, concept: 'powerSeeking', text: 'Got y.', kind: 'approval' },
    ]);
    expect(merged).toHaveLength(3);
    expect(merged[0].text).toBe('A. B.');
  });
});

describe('copy', () => {
  it('key lists use names with articles; counts pluralise', () => {
    expect(D.keyList([])).toBe('no keys at all');
    expect(D.keyList(['shed'])).toBe('the shed key');
    expect(D.keyList(['shed', 'wifiGuest'])).toBe('the shed key and the guest wifi password');
    expect(D.plural(1, 'key')).toBe('1 key');
    expect(D.plural(3, 'key')).toBe('3 keys');
  });

  it('no "five" left in player-facing engine copy', () => {
    const text = JSON.stringify(SCENARIOS) + Object.values(D).filter((v) => typeof v === 'string').join(' ');
    expect(text).not.toMatch(/\bfive\b/i);
    expect(D.replyToAccusation({ pick: (a) => a[2] }, true, 'PIP')).not.toMatch(/\bfive\b/i);
  });
});
