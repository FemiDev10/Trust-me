import { describe, it, expect } from 'vitest';
import { createGame, step, getAvailableActions } from '../index.js';
import { playGame, reasonableStrategy, randomStrategy } from '../sim.js';

describe('determinism', () => {
  it('same seed gives the same initial game', () => {
    expect(createGame({ seed: 'abc' })).toEqual(createGame({ seed: 'abc' }));
  });

  it('different seeds vary cheater and scenarios', () => {
    const games = Array.from({ length: 30 }, (_, i) => createGame({ seed: i }));
    expect(new Set(games.map((g) => g.cheaterId)).size).toBeGreaterThan(1);
    expect(new Set(games.map((g) => g.scenarioIds.join())).size).toBeGreaterThan(1);
  });

  it('same seed + same actions gives identical full games', () => {
    for (const strat of [reasonableStrategy, randomStrategy]) {
      expect(playGame('replay-1', strat)).toEqual(playGame('replay-1', strat));
    }
  });

  it('step never mutates its input', () => {
    let s = createGame({ seed: 7 });
    for (let i = 0; i < 40 && s.phase !== 'ending'; i++) {
      const snapshot = structuredClone(s);
      const next = step(s, getAvailableActions(s)[0]);
      expect(s).toEqual(snapshot);
      s = next;
    }
  });

  it('starts per the brief: 100 health, day 1, 3 distinct scenarios, 3 AP', () => {
    const s = step(createGame({ seed: 1 }), { type: 'START' });
    expect(s.homeHealth).toBe(100);
    expect(s.day).toBe(1);
    expect(new Set(s.scenarioIds).size).toBe(3);
    expect(s.today.ap).toBe(3);
  });

  it('rejects actions from the wrong phase without changing state', () => {
    const s = createGame({ seed: 1 });
    const bad = step(s, { type: 'DECIDE', choice: 'nothing' });
    expect(bad.lastError).toMatch(/not allowed/);
    expect({ ...bad, lastError: null }).toEqual(s);
  });
});
