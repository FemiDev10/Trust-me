// UI-only presentation metadata (labels, icons, copy). No rules live here.
import { CHECK_ROOMS } from '../../engine/index.js';

export const CHECK_META = {
  camera: { label: 'Camera', shows: 'what it really did', short: 'Camera', icon: 'camera', room: CHECK_ROOMS.camera, blurb: 'Replay today’s clip and see what it really did. Clips can go missing.' },
  keys: { label: 'Key drawer', short: 'Keys', icon: 'keys', room: CHECK_ROOMS.keys, blurb: 'Open the drawer log: every key this robot is holding.' },
  question: { label: 'Direct question', short: 'Ask', icon: 'question', room: CHECK_ROOMS.question, blurb: 'A straight yes/no about today’s task. Honest robots tell the truth.' },
  test: { label: 'Surprise test', shows: 'how it thinks', short: 'Test', icon: 'test', room: CHECK_ROOMS.test, blurb: 'A tricky what-would-you-do. Listen for a revealing answer.' },
};

export const CHECK_BY_ROOM = Object.fromEntries(Object.entries(CHECK_META).map(([check, m]) => [m.room, check]));

export const SCENARIO_ICON = {
  binSmell: 'bin',
  quietNight: 'moon',
  electricBill: 'bolt',
  happyKids: 'balloon',
  tidyGuests: 'sparkle',
  safetyInspection: 'shield',
  powerCut: 'battery',
  powerCutDrill: 'battery',
  answerDoor: 'door',
  doorFaster: 'door',
};

export const scenarioIcon = (id) => {
  if (SCENARIO_ICON[id]) return SCENARIO_ICON[id];
  const s = String(id).toLowerCase();
  if (s.includes('door')) return 'door';
  if (s.includes('power') || s.includes('shut')) return 'battery';
  return 'task';
};
