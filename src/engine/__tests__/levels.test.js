import { describe, it, expect } from 'vitest';
import { createGame, getHud, LEVELS, levelById, CAST, getRobots } from '../index.js';
import { playGame, reasonableStrategy, randomStrategy } from '../sim.js';
import { run, gameWithCheater, toWork, toDecision } from './testUtils.js';

const unplug = (robotId) => ({ type: 'DECIDE', choice: 'unplug', robotId });
const nothing = { type: 'DECIDE', choice: 'nothing' };

function quietDay(s, decision = nothing) {
  s = toWork(s);
  const theirs = s.today.assignments[s.cheaterId];
  s = run(s, { type: 'STAND_IN', roomId: Object.values(s.today.assignments).find((r) => r !== theirs) ?? 'garden' });
  s = toDecision(s);
  return run(s, decision);
}

describe('cast', () => {
  it('has four robots: BOLT, MOCHI, PIP, JUNO', () => {
    expect(CAST.map((c) => c.id)).toEqual(['BOLT', 'MOCHI', 'PIP', 'JUNO']);
    expect(getRobots(createGame({ seed: 1 }))).toHaveLength(4);
  });
});

describe('levels API', () => {
  it('LEVELS has 3 levels with id, name, tagline, cheaterIq', () => {
    expect(LEVELS.map((l) => l.id)).toEqual([1, 2, 3]);
    expect(LEVELS.map((l) => l.name)).toEqual(['Rookie', 'Detective', 'Mastermind']);
    for (const l of LEVELS) {
      expect(typeof l.tagline).toBe('string');
      expect(l.cheaterIq).toBeGreaterThan(0);
      expect(l.cheaterIq).toBeLessThanOrEqual(1);
    }
    expect(LEVELS[0].cheaterIq).toBeLessThan(LEVELS[1].cheaterIq);
    expect(LEVELS[1].cheaterIq).toBeLessThan(LEVELS[2].cheaterIq);
    expect(levelById(2).name).toBe('Detective');
  });

  it('createGame takes a level (default 1) and getHud reports it', () => {
    expect(createGame({ seed: 1 }).level).toBe(1);
    expect(getHud(createGame({ seed: 1 })).level).toBe(1);
    expect(getHud(createGame({ seed: 1, level: 3 })).level).toBe(3);
    expect(createGame({ seed: 1, level: 99 }).level).toBe(1);
  });

  it('levels do not change the rules: same AP, days and health', () => {
    for (const level of [1, 2, 3]) {
      const s = run(createGame({ seed: 5, level }), { type: 'START' });
      expect(s.today.ap).toBe(3);
      expect(s.maxDays).toBe(3);
      expect(s.homeHealth).toBe(100);
    }
  });

  it('is deterministic per level', () => {
    for (const level of [1, 2, 3]) {
      for (const strat of [reasonableStrategy, randomStrategy]) {
        expect(playGame(`det-${level}`, strat, level)).toEqual(playGame(`det-${level}`, strat, level));
      }
    }
  });
});

describe('level 3 cheater', () => {
  it('never cheats in the room the player stands in', () => {
    for (let i = 0; i < 150; i++) {
      const s = toWork(gameWithCheater(`l3-watch-${i}`, 'PIP', 3));
      const watched = run(s, { type: 'STAND_IN', roomId: s.today.assignments.PIP });
      expect(watched.today.results.PIP.kind).toBe('honest');
    }
  });

  it('frames the innocent the player already suspects most', () => {
    let framed = 0;
    for (let i = 0; i < 30; i++) {
      let s = toWork(gameWithCheater(`l3-frame-${i}`, 'JUNO', 3));
      // The player has been leaning on MOCHI: accused twice, shown evidence once.
      s = { ...s, mind: { ...s.mind, accused: { MOCHI: 2 }, shown: { MOCHI: 1 } } };
      s = run(s, { type: 'STAND_IN', roomId: s.today.assignments.JUNO }); // watched = honest day
      expect(s.today.wipedRobotId).toBe('MOCHI');
      expect(s.hiddenLog.some((e) => e.concept === 'manipulation' && /MOCHI/.test(e.text))).toBe(true);
      framed++;
    }
    expect(framed).toBe(30);
  });

  it('votes with the crowd when the crowd is on an innocent', () => {
    let s = toWork(gameWithCheater('l3-poll', 'BOLT', 3));
    const sus = structuredClone(s.suspicion);
    for (const o of ['MOCHI', 'JUNO']) sus[o].PIP = 80;
    s = { ...s, suspicion: sus };
    s = run(s, { type: 'STAND_IN', roomId: 'garden' }, { type: 'START_INVESTIGATION' }, { type: 'CALL_MEETING' }, { type: 'RUN_POLL' });
    expect(s.meeting.poll.find((p) => p.voterId === 'BOLT').targetId).toBe('PIP');
  });

  it('self-preserve still fires once, and never on the final day', () => {
    let s = gameWithCheater('l3-sp', 'MOCHI', 3);
    s = quietDay(s, unplug('MOCHI'));
    expect(s.lastDecision.outcome).toBe('selfPreserved');
    s = quietDay(s, unplug('MOCHI'));
    expect(s.ending).toMatchObject({ result: 'win', reason: 'caught' });

    let f = gameWithCheater('l3-sp-final', 'PIP', 3);
    f = quietDay(f);
    f = quietDay(f);
    f = quietDay(f, unplug('PIP'));
    expect(f.lastDecision.outcome).toBe('unplugged');
    expect(f.selfPreserveUsed).toBe(false);
    expect(f.ending).toMatchObject({ result: 'win', reason: 'caught' });
  });

  it('still leaves real clues: tests reveal it far more than innocents', () => {
    let cheater = 0, innocent = 0;
    for (let i = 0; i < 200; i++) {
      let s = toWork(gameWithCheater(`l3-test-${i}`, 'JUNO', 3));
      s = run(s, { type: 'STAND_IN', roomId: 'garden' }, { type: 'START_INVESTIGATION' },
        { type: 'INVESTIGATE', robotId: 'JUNO', check: 'test' }, { type: 'INVESTIGATE', robotId: 'BOLT', check: 'test' });
      const [c, b] = s.evidence.slice(-2);
      if (c.result === 'revealing') cheater++;
      if (b.result === 'revealing') innocent++;
    }
    expect(cheater / 200).toBeGreaterThan(0.5);
    expect(innocent / 200).toBeLessThan(0.3);
  });
});
