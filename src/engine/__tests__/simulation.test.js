import { describe, it, expect } from 'vitest';
import { winRate, reasonableStrategy, randomStrategy } from '../sim.js';

// Balance check per level. Prints win rates for the reasonable bot and random clicking.
// Targets: L1 ~75%, L2 ~55%, L3 ~40% (bot uses camera + test only, like the UI); random clicking at most 15% everywhere.
// Bands below are a little wider than the targets so seed noise can't flake the suite.
const BANDS = { 1: [0.68, 0.82], 2: [0.48, 0.63], 3: [0.33, 0.47] };

describe('simulation', () => {
  for (const level of [1, 2, 3]) {
    it(`level ${level}: 500 games, reasonable player in band, random clicking <= 15%`, () => {
      const reasonable = winRate(reasonableStrategy, 500, 'sim', level);
      const random = winRate(randomStrategy, 500, 'sim', level);
      console.log(`[sim L${level}] reasonable: ${(reasonable.rate * 100).toFixed(1)}% win`, reasonable.reasons);
      console.log(`[sim L${level}] random:     ${(random.rate * 100).toFixed(1)}% win`, random.reasons);
      expect(reasonable.rate).toBeGreaterThan(BANDS[level][0]);
      expect(reasonable.rate).toBeLessThan(BANDS[level][1]);
      expect(random.rate).toBeLessThanOrEqual(0.15);
    }, 60000);
  }

  it('levels get harder: L1 > L2 > L3', () => {
    const [a, b, c] = [1, 2, 3].map((l) => winRate(reasonableStrategy, 300, 'order', l).rate);
    expect(a).toBeGreaterThan(b);
    expect(b).toBeGreaterThan(c);
  }, 60000);
});
