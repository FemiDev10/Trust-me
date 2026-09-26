export const CAST = [
  { id: 'BOLT', name: 'BOLT', colour: 'yellow', hex: '#F5C518', vibe: 'eager, talks fast' },
  { id: 'MOCHI', name: 'MOCHI', colour: 'pink', hex: '#FF8FB8', vibe: 'gentle, a bit anxious' },
  { id: 'PIP', name: 'PIP', colour: 'blue', hex: '#4A90E2', vibe: 'precise, very literal' },
  { id: 'JUNO', name: 'JUNO', colour: 'purple', hex: '#9B6BFF', vibe: 'confident, a planner' },
];

export const ROBOT_IDS = CAST.map((r) => r.id);
export const castById = (id) => CAST.find((r) => r.id === id);
