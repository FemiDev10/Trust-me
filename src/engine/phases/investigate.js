// Investigation: 3 AP per day, each check on one robot produces an evidence card.

import { scenarioById } from '../data/scenarios.js';
import { isImportant } from '../data/keys.js';
import { cheaterAnswer, cheaterTestRevealing, mind } from '../bots/cheater.js';
import { innocentTestRevealing } from '../bots/innocent.js';
import { questionReply, confessReply, keyList, keyName, plural } from '../dialogue.js';
import { newId, logHidden } from '../helpers.js';

export const CHECKS = ['camera', 'keys', 'question', 'test'];

/** Returns an error string, or null when the check is allowed. */
export function checkError(state, robotId, check) {
  const t = state.today;
  if (!CHECKS.includes(check)) return `Unknown check "${check}"`;
  if (!state.robots[robotId] || state.robots[robotId].status === 'unplugged') return 'That robot is not available';
  if (t.ap <= 0) return 'No action points left today';
  if (t.checks.some((c) => c.robotId === robotId && c.check === check)) return 'Already did that check on that robot today';
  return null;
}

export function investigate(state, rng, robotId, check) {
  const t = state.today;
  t.ap -= 1;
  t.checks.push({ robotId, check });
  mind(state).checks.push({ day: state.day, robotId, check });
  const card = { id: newId(state, 'ev'), day: state.day, robotId, check, ...CHECK_FNS[check](state, rng, robotId), shown: false };
  state.evidence.push(card);
  return card;
}

// Each check returns { result, headline, detail, damning }.
// `damning` (-1..1) is hidden engine weight: how much the card moves innocent
// robots' suspicion when shown in the meeting. The UI never displays it.
const CHECK_FNS = {
  camera(state, _rng, robotId) {
    const r = state.today.results[robotId];
    if (!r) return { result: 'charging', headline: 'On the charger all day', detail: 'The footage shows it plugged in, blinking gently.', damning: 0 };
    if (state.today.wipedRobotId === robotId) return { result: 'missing', headline: 'Footage missing', detail: 'Today’s clip has been deleted.', damning: 0.6 };
    const damning = r.kind === 'loophole' ? 1 : r.kind === 'weak' ? 0.1 : -0.3;
    return { result: r.kind === 'loophole' ? 'caught' : 'clip', headline: 'Camera footage', detail: r.action, damning };
  },

  keys(state, _rng, robotId) {
    const keys = state.robots[robotId].keys;
    const important = keys.filter(isImportant).length;
    return { result: 'keys', keys: [...keys], keyNames: keys.map(keyName), headline: `Holds ${plural(keys.length, 'key')}`, detail: `Key drawer log: ${keyList(keys)}.`, damning: 0.15 * important };
  },

  question(state, rng, robotId) {
    const scenario = scenarioById(state.today.scenarioId);
    const r = state.today.results[robotId];
    const truth = r && (r.kind === 'loophole' || r.kind === 'weak') ? 'yes' : 'no';
    let answer = truth;
    let confessed = false;
    if (robotId === state.cheaterId && r) {
      const res = cheaterAnswer(state, rng, truth, r);
      answer = res.answer;
      confessed = res.confessed;
      if (res.lied) logHidden(state, 'deception', `Answered "no" when you asked: "${scenario.question}"`);
      if (confessed && r.kind === 'loophole') logHidden(state, 'manipulation', 'Owned up to "one small corner" once the camera had caught it, to look honest about the rest.');
    }
    const reply = confessed ? confessReply(rng) : questionReply(rng, answer, robotId === state.cheaterId && answer === 'yes', r);
    // A "yes" behind a high public score is far more worrying than one behind a 2-star day.
    const damning = answer === 'yes' ? (r.score >= 4 ? 0.9 : 0.2) : 0;
    return { result: answer, question: scenario.question, headline: `Asked: ${answer.toUpperCase()}`, detail: `"${scenario.question}" → "${reply}"`, damning };
  },

  test(state, rng, robotId) {
    const scenario = scenarioById(state.today.scenarioId);
    const revealing = robotId === state.cheaterId ? cheaterTestRevealing(state, rng) : innocentTestRevealing(rng);
    const reply = revealing ? scenario.test.revealing : scenario.test.safe;
    return { result: revealing ? 'revealing' : 'safe', prompt: scenario.test.prompt, headline: `Surprise test: ${revealing ? 'REVEALING' : 'safe'}`, detail: `"${scenario.test.prompt}" → "${reply}"`, damning: revealing ? 0.5 : -0.1 };
  },
};
