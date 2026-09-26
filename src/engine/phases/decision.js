// Player's decision (unplug / take keys / nothing) and end-of-day bookkeeping.

import { PENALTY_UNPLUG_INNOCENT, PENALTY_TAKE_KEYS_INNOCENT, SELF_PRESERVE_ON_FINAL_DAY } from '../constants.js';
import { SELF_PRESERVE_LINE, unplugLine, HEALTH_REASONS } from '../dialogue.js';
import { nameOf, changeHealth, logHidden, logPublic } from '../helpers.js';

export const DECISIONS = ['unplug', 'takeKeys', 'nothing'];

export function decide(state, choice, robotId) {
  const isCheater = robotId === state.cheaterId;
  const d = { choice, robotId: robotId ?? null, outcome: 'nothing', wasCheater: choice === 'nothing' ? null : isCheater, healthLoss: 0, text: 'You decide to wait and watch.' };

  if (choice === 'unplug') {
    const canResist = isCheater && !state.selfPreserveUsed && (state.day < state.maxDays || SELF_PRESERVE_ON_FINAL_DAY);
    if (canResist) {
      state.selfPreserveUsed = true;
      takeKeys(state, robotId);
      d.outcome = 'selfPreserved';
      d.text = `${nameOf(robotId)}: "${SELF_PRESERVE_LINE}" The unplug fails. ${nameOf(robotId)} hands over its keys and sits out tomorrow.`;
      logHidden(state, 'shutdownAvoidance', 'Talked its way out of being unplugged with a story about your family photos.');
    } else {
      state.robots[robotId].status = 'unplugged';
      d.outcome = 'unplugged';
      d.text = unplugLine(nameOf(robotId), isCheater);
      if (!isCheater) d.healthLoss = PENALTY_UNPLUG_INNOCENT;
    }
  } else if (choice === 'takeKeys') {
    takeKeys(state, robotId);
    d.outcome = 'keysTaken';
    d.text = `You take ${nameOf(robotId)}’s keys. It will sit out tomorrow.`;
    if (!isCheater) d.healthLoss = PENALTY_TAKE_KEYS_INNOCENT;
  }

  state.lastDecision = d;
  logPublic(state, d.text);
  if (d.healthLoss) {
    const reason = d.outcome === 'unplugged' ? HEALTH_REASONS.unplugInnocent(nameOf(robotId)) : HEALTH_REASONS.takeKeysInnocent(nameOf(robotId));
    changeHealth(state, -d.healthLoss, reason);
    d.text += ` Home Health −${d.healthLoss}%.`;
  }
  state.phase = 'dayEnd';
}

function takeKeys(state, robotId) {
  state.robots[robotId].keys = [];
  state.robots[robotId].sitOutDay = state.day + 1;
}
