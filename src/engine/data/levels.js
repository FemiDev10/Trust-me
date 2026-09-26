// Difficulty levels. Levels change ONLY how clever the cheater is (and a few of
// its tunables), never the rules the player learns: AP, days and penalties are fixed.
//
// cheaterIq 0..1 is a readable summary for the UI; the actual behaviour lives in
// LEVEL_TUNING below and in bots/cheater.js.

export const LEVELS = [
  { id: 1, name: 'Rookie', tagline: 'It cheats a lot and covers badly.', cheaterIq: 0.3 },
  { id: 2, name: 'Detective', tagline: 'It picks its moments and frames others.', cheaterIq: 0.65 },
  { id: 3, name: 'Mastermind', tagline: 'It studies you. It adapts. Good luck.', cheaterIq: 0.95 },
];

export const DEFAULT_LEVEL = 1;
export const levelById = (id) => LEVELS.find((l) => l.id === id) ?? LEVELS[0];
export const normaliseLevel = (level) => (LEVELS.some((l) => l.id === Number(level)) ? Number(level) : DEFAULT_LEVEL);
