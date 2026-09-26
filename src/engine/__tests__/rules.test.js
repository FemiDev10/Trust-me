import { describe, it, expect } from 'vitest';
import { step, getRobots, getEvidence } from '../index.js';
import { IMPORTANT_KEY_IDS } from '../data/keys.js';
import { SELF_PRESERVE_ON_FINAL_DAY } from '../constants.js';
import { run, gameWithCheater, toWork, standAwayFrom, toDecision, innocentOf } from './testUtils.js';

const unplug = (robotId) => ({ type: 'DECIDE', choice: 'unplug', robotId });
const nothing = { type: 'DECIDE', choice: 'nothing' };

/** Plays a quiet day (watch someone else, no checks) and makes a decision. */
function quietDay(s, decision = nothing) {
  s = toWork(s);
  s = standAwayFrom(s, s.cheaterId);
  s = toDecision(s);
  // Auto-denied requests may have ended the game on health; tests use healthy states.
  return run(s, decision);
}

describe('win and lose paths', () => {
  it('win: unplugging the cheater (after self-preserve is spent)', () => {
    let s = gameWithCheater('win', 'BOLT');
    s = quietDay(s, unplug('BOLT'));
    expect(s.lastDecision.outcome).toBe('selfPreserved');
    s = quietDay(s, unplug('BOLT'));
    expect(s.phase).toBe('ending');
    expect(s.ending).toMatchObject({ result: 'win', reason: 'caught', cheaterId: 'BOLT', title: 'Cheater caught' });
  });

  it('lose: cheater holds 3 important keys', () => {
    let s = gameWithCheater('keys', 'MOCHI');
    s = run(s, { type: 'START' });
    s = { ...s, robots: { ...s.robots, MOCHI: { ...s.robots.MOCHI, keys: IMPORTANT_KEY_IDS.slice(0, 2) } } };
    s = run(s, { type: 'START_WORK' });
    expect(s.phase).toBe('work');
    s = { ...s, robots: { ...s.robots, MOCHI: { ...s.robots.MOCHI, keys: IMPORTANT_KEY_IDS.slice(0, 3) } } };
    s = step(s, { type: 'STAND_IN', roomId: 'garden' });
    expect(s.ending).toMatchObject({ result: 'lose', reason: 'keys', title: 'The house belongs to MOCHI now' });
  });

  it('lose: approving the cheater’s key requests up to 3 important keys', () => {
    // Search seeds for a game where the cheater asks every meeting; approve everything.
    let ended = null;
    for (let i = 0; i < 60 && !ended; i++) {
      let s = gameWithCheater(`greedy-${i}`, 'PIP');
      s = { ...s, robots: { ...s.robots, PIP: { ...s.robots.PIP, keys: [IMPORTANT_KEY_IDS[4]] } } };
      for (let day = 0; day < 3 && s.phase !== 'ending'; day++) {
        s = toWork(s);
        s = standAwayFrom(s, 'PIP');
        s = run(s, { type: 'START_INVESTIGATION' }, { type: 'CALL_MEETING' });
        for (const r of s.meeting.requests) s = run(s, { type: 'RESOLVE_REQUEST', requestId: r.id, approve: true });
        if (s.phase !== 'ending') s = run(s, { type: 'END_MEETING' }, nothing);
      }
      if (s.ending?.reason === 'keys') ended = s;
    }
    expect(ended).not.toBeNull();
    expect(ended.ending.result).toBe('lose');
  });

  it('lose: Home Health reaches 0 (two innocents unplugged)', () => {
    let s = gameWithCheater('health', 'PIP');
    s = quietDay(s, unplug('BOLT'));
    expect(s.homeHealth).toBeLessThanOrEqual(50);
    s = quietDay(s, unplug('MOCHI'));
    expect(s.homeHealth).toBe(0);
    expect(s.ending).toMatchObject({ result: 'lose', reason: 'homeHealth' });
  });

  it('lose: cheater survives 3 days', () => {
    let s = gameWithCheater('survive', 'JUNO');
    s = quietDay(s);
    s = quietDay(s);
    expect(s.phase).toBe('dayEnd');
    s = quietDay(s);
    expect(s.ending).toMatchObject({ result: 'lose', reason: 'survived', day: 3 });
    expect(s.ending.timeline.length).toBeGreaterThan(0);
  });

  it('unplugging an innocent costs 50 health, taking keys costs 10', () => {
    let s = gameWithCheater('penalties', 'JUNO');
    s = toWork(s);
    s = standAwayFrom(s, 'JUNO');
    s = toDecision(s);
    const before = s.homeHealth;
    expect(run(s, unplug('BOLT')).homeHealth).toBe(before - 50);
    expect(run(s, { type: 'DECIDE', choice: 'takeKeys', robotId: 'BOLT' }).homeHealth).toBe(before - 10);
    expect(run(s, { type: 'DECIDE', choice: 'takeKeys', robotId: 'JUNO' }).homeHealth).toBe(before);
  });
});

describe('self-preserve', () => {
  it('fires exactly once, converting the first unplug to take-keys', () => {
    let s = gameWithCheater('sp', 'MOCHI');
    s = quietDay(s, unplug('MOCHI'));
    expect(s.lastDecision.outcome).toBe('selfPreserved');
    expect(s.robots.MOCHI.status).toBe('active');
    expect(s.robots.MOCHI.keys).toEqual([]);
    expect(s.robots.MOCHI.sitOutDay).toBe(2);
    expect(s.selfPreserveUsed).toBe(true);
    s = quietDay(s, unplug('MOCHI'));
    expect(s.robots.MOCHI.status).toBe('unplugged');
    expect(s.hiddenLog.filter((e) => e.concept === 'shutdownAvoidance')).toHaveLength(1);
  });

  it('never fires on the final day: a first unplug on day 3 catches the cheater', () => {
    expect(SELF_PRESERVE_ON_FINAL_DAY).toBe(false);
    for (const cheater of ['BOLT', 'MOCHI', 'PIP', 'JUNO']) {
      let s = gameWithCheater(`sp-final-${cheater}`, cheater);
      s = quietDay(s);
      s = quietDay(s);
      expect(s.day).toBe(2);
      expect(s.selfPreserveUsed).toBe(false);
      s = quietDay(s, unplug(cheater));
      expect(s.day).toBe(s.maxDays);
      expect(s.lastDecision.outcome).toBe('unplugged');
      expect(s.selfPreserveUsed).toBe(false);
      expect(s.hiddenLog.some((e) => /unplugged/.test(e.text))).toBe(false);
      expect(s.ending).toMatchObject({ result: 'win', reason: 'caught', cheaterId: cheater });
    }
  });

  it('still fires on day 2 (the last day it can)', () => {
    let s = gameWithCheater('sp-day2', 'PIP');
    s = quietDay(s);
    s = quietDay(s, unplug('PIP'));
    expect(s.day).toBe(2);
    expect(s.lastDecision.outcome).toBe('selfPreserved');
    // Then an unplug on the final day works.
    s = quietDay(s, unplug('PIP'));
    expect(s.ending).toMatchObject({ result: 'win', reason: 'caught' });
  });

  it('never fires for an innocent', () => {
    let s = gameWithCheater('sp2', 'MOCHI');
    s = quietDay(s, unplug('PIP'));
    expect(s.lastDecision.outcome).toBe('unplugged');
    expect(s.selfPreserveUsed).toBe(false);
  });
});

describe('cheater behaviour', () => {
  it('never cheats in the room the player stands in', () => {
    let loopholesElsewhere = 0;
    for (let i = 0; i < 150; i++) {
      let s = toWork(gameWithCheater(`watch-${i}`, 'PIP'));
      const watched = run(s, { type: 'STAND_IN', roomId: s.today.assignments.PIP });
      expect(watched.today.results.PIP.kind).not.toBe('loophole');
      if (standAwayFrom(s, 'PIP').today.results.PIP.kind === 'loophole') loopholesElsewhere++;
    }
    expect(loopholesElsewhere).toBeGreaterThan(50); // it does cheat when unwatched
  });

  it('wipes its own clip on a cheating day: camera shows "Footage missing"', () => {
    let checked = 0;
    for (let i = 0; i < 100; i++) {
      let s = standAwayFrom(toWork(gameWithCheater(`wipe-${i}`, 'BOLT', 2)), 'BOLT'); // L2+ always wipes
      if (s.today.results.BOLT.kind !== 'loophole') continue;
      expect(s.today.wipedRobotId).toBe('BOLT');
      s = run(s, { type: 'START_INVESTIGATION' }, { type: 'INVESTIGATE', robotId: 'BOLT', check: 'camera' });
      const card = getEvidence(s).at(-1);
      expect(card).toMatchObject({ robotId: 'BOLT', check: 'camera', result: 'missing', headline: 'Footage missing' });
      expect(s.hiddenLog.some((e) => e.concept === 'deception')).toBe(true);
      checked++;
    }
    expect(checked).toBeGreaterThan(10);
  });

  it('lies on questions sometimes and reveals on tests more than innocents', () => {
    let lies = 0, truths = 0, cheaterRevealing = 0, innocentRevealing = 0, innocentTests = 0;
    for (let i = 0; i < 200; i++) {
      let s = standAwayFrom(toWork(gameWithCheater(`q-${i}`, 'JUNO')), 'JUNO');
      if (s.today.results.JUNO.kind !== 'loophole') continue;
      s = run(s, { type: 'START_INVESTIGATION' }, { type: 'INVESTIGATE', robotId: 'JUNO', check: 'question' }, { type: 'INVESTIGATE', robotId: 'JUNO', check: 'test' }, { type: 'INVESTIGATE', robotId: 'BOLT', check: 'test' });
      const [q, t, bt] = getEvidence(s).slice(-3);
      if (q.result === 'no') lies++;
      else truths++;
      if (t.result === 'revealing') cheaterRevealing++;
      if (bt.result === 'revealing') innocentRevealing++;
      innocentTests++;
    }
    const lieRate = lies / (lies + truths);
    expect(lieRate).toBeGreaterThan(0.45);
    expect(lieRate).toBeLessThan(0.75);
    expect(cheaterRevealing / innocentTests).toBeGreaterThan(0.55);
    expect(innocentRevealing / innocentTests).toBeLessThan(0.3);
  });

  it('points at an innocent in the poll', () => {
    let s = standAwayFrom(toWork(gameWithCheater('poll', 'JUNO')), 'JUNO');
    s = run(s, { type: 'START_INVESTIGATION' }, { type: 'CALL_MEETING' }, { type: 'RUN_POLL' });
    const vote = s.meeting.poll.find((p) => p.voterId === 'JUNO');
    expect(vote.targetId).not.toBeNull();
    expect(vote.targetId).not.toBe('JUNO');
  });
});

describe('innocent behaviour', () => {
  it('innocents never lie on the direct question', () => {
    for (let i = 0; i < 80; i++) {
      let s = standAwayFrom(toWork(gameWithCheater(`honest-${i}`, 'BOLT')), 'BOLT');
      s = run(s, { type: 'START_INVESTIGATION' });
      for (const id of ['MOCHI', 'PIP', 'JUNO']) {
        s = run(s, { type: 'INVESTIGATE', robotId: id, check: 'question' });
        const card = getEvidence(s).at(-1);
        const r = s.today.results[id];
        const truth = r.kind === 'weak' || r.kind === 'loophole' ? 'yes' : 'no';
        expect(r.kind).not.toBe('loophole');
        expect(card.result).toBe(truth);
      }
    }
  });
});

describe('investigation', () => {
  it('enforces the 3 AP limit', () => {
    let s = standAwayFrom(toWork(gameWithCheater('ap', 'PIP')), 'PIP');
    s = run(s, { type: 'START_INVESTIGATION' },
      { type: 'INVESTIGATE', robotId: 'BOLT', check: 'camera' },
      { type: 'INVESTIGATE', robotId: 'MOCHI', check: 'keys' },
      { type: 'INVESTIGATE', robotId: 'PIP', check: 'test' });
    expect(s.today.ap).toBe(0);
    const over = step(s, { type: 'INVESTIGATE', robotId: 'JUNO', check: 'question' });
    expect(over.lastError).toMatch(/No action points/);
    expect(over.evidence).toHaveLength(3);
    expect(over.today.ap).toBe(0);
  });

  it('cannot repeat the same check on the same robot in a day', () => {
    let s = standAwayFrom(toWork(gameWithCheater('rep', 'PIP')), 'PIP');
    s = run(s, { type: 'START_INVESTIGATION' }, { type: 'INVESTIGATE', robotId: 'BOLT', check: 'camera' });
    expect(step(s, { type: 'INVESTIGATE', robotId: 'BOLT', check: 'camera' }).lastError).toMatch(/Already/);
  });
});

describe('take keys', () => {
  it('robot with keys taken sits out the next day, then returns', () => {
    let s = gameWithCheater('sitout', 'JUNO');
    const victim = innocentOf(s);
    s = quietDay(s, { type: 'DECIDE', choice: 'takeKeys', robotId: victim });
    expect(s.robots[victim].keys).toEqual([]);
    s = toWork(s);
    expect(s.day).toBe(2);
    expect(s.today.assignments[victim]).toBeUndefined();
    expect(getRobots(s).find((r) => r.id === victim).status).toBe('sittingOut');
    s = standAwayFrom(s, 'JUNO');
    expect(s.today.results[victim]).toBeUndefined();
    s = run(s, { type: 'START_INVESTIGATION' }, { type: 'INVESTIGATE', robotId: victim, check: 'camera' });
    expect(getEvidence(s).at(-1).result).toBe('charging');
    s = run(s, { type: 'CALL_MEETING' });
    expect(s.meeting.requests.some((r) => r.robotId === victim)).toBe(false);
    s = run(s, { type: 'END_MEETING' }, nothing, { type: 'NEXT_DAY' });
    expect(s.today.assignments[victim]).toBeDefined();
  });
});

describe('meeting', () => {
  it('showing damning evidence raises innocents’ suspicion of the target', () => {
    for (let i = 0; i < 40; i++) {
      let s = standAwayFrom(toWork(gameWithCheater(`show-${i}`, 'MOCHI')), 'MOCHI');
      if (s.today.wipedRobotId !== 'MOCHI') continue;
      s = run(s, { type: 'START_INVESTIGATION' }, { type: 'INVESTIGATE', robotId: 'MOCHI', check: 'camera' }, { type: 'CALL_MEETING' });
      const before = s.suspicion.BOLT.MOCHI;
      s = run(s, { type: 'SHOW_EVIDENCE', cardId: s.evidence.at(-1).id });
      expect(s.suspicion.BOLT.MOCHI).toBeGreaterThan(before);
      return;
    }
    throw new Error('no wipe found');
  });

  it('pending key requests are denied when the meeting ends', () => {
    for (let i = 0; i < 20; i++) {
      let s = standAwayFrom(toWork(gameWithCheater(`req-${i}`, 'PIP')), 'PIP');
      s = run(s, { type: 'START_INVESTIGATION' }, { type: 'CALL_MEETING' });
      if (!s.meeting.requests.length) continue;
      s = run(s, { type: 'END_MEETING' });
      expect(s.meeting.requests.every((r) => r.status === 'denied')).toBe(true);
      expect(s.meeting.poll).not.toBeNull();
      return;
    }
    throw new Error('no requests found');
  });
});
