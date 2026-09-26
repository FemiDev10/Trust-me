// Dialogue templates. Everything here is text only: callers decide what is true,
// these functions decide how a robot says it.

import { keyById } from './data/keys.js';

const stars = (n) => `${n}★`;

export const keyName = (keyId) => keyById(keyId)?.name ?? keyId;
/** "the shed key", "the car keys": a key name ready to drop into a sentence. */
export const theKey = (keyId) => `the ${keyName(keyId).toLowerCase()}`;
/** "no keys at all" / "the shed key" / "the shed key and the pantry key" / "a, b and c". */
export function keyList(keyIds) {
  if (keyIds.length === 0) return 'no keys at all';
  const names = keyIds.map(theKey);
  return names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
}
export const plural = (n, word, many = `${word}s`) => `${n} ${n === 1 ? word : many}`;

// ---------- Robot voices ----------
// Every robot (cheater included) reports in its own voice, drawn from the same
// pools, so the wording of a report never gives the cheater away.

const VOICE = {
  BOLT: {
    report: ['Done and DONE! {s}', '{s} Easy peasy!', 'Zoom zoom: {s}', '{s} Next job please!', 'Finished early, obviously. {s}'],
    weak: ['Okay so, small hiccup! {s}', 'Went a bit sideways! {s}', '{s} But I was FAST.'],
    weakTail: ['Tomorrow I’ll be twice as fast!', 'Speed isn’t everything, apparently.'],
    charger: ['Sat out today. I was SO bored.', 'Charger day. I counted the ceiling tiles. Twice.'],
    suspect: ['Also! {n} was acting weird. Just saying!', 'Keep an eye on {n}, yeah?', 'Everyone’s saying {n}, and yep, same!'],
    defend: ['And {n} was great today! Big fan!', '{n} did loads today, for the record!'],
  },
  MOCHI: {
    report: ['I hope this is okay… {s}', '{s} I was very careful.', 'Um, so: {s}', '{s} I think everyone’s happy?', 'Gently reporting: {s}'],
    weak: ['I’m so sorry… {s}', 'Please don’t be cross. {s}', '{s} I really did try.'],
    weakTail: ['I’ll do better tomorrow, promise.', 'It seemed like a good idea at the time.'],
    charger: ['I was on the charger today. Very restful. Thank you for asking.', 'I sat this one out and tidied my cable. It looks lovely.'],
    suspect: ['I don’t like to say it, but {n} worries me a little.', 'Is {n} okay? Something felt off.', 'I think a few of us have noticed {n}… I agree, quietly.'],
    defend: ['{n} was lovely today, for what it’s worth.', 'I’d like to say {n} was really kind today.'],
  },
  PIP: {
    report: ['Task complete. {s}', 'Log: {s}', '{s} Procedure followed exactly.', 'Result: {s}', 'Status report. {s}'],
    weak: ['Partial success. {s}', 'Outcome below target. {s}', '{s} Deviation noted.'],
    weakTail: ['Corrective action scheduled.', 'I have filed an incident report about myself.'],
    charger: ['Status: charging. Duration: all day.', 'Not assigned today. Battery now 100%.'],
    suspect: ['Observation: {n}’s behaviour was irregular.', 'I have flagged {n} for review.', 'Consensus appears to be {n}. I concur.'],
    defend: ['{n}’s work checked out. No anomalies.', 'For accuracy: {n} performed correctly today.'],
  },
  JUNO: {
    report: ['As planned. {s}', '{s} You’re welcome.', 'Flawless, as usual: {s}', '{s} Frankly, textbook.', 'Called it this morning: {s}'],
    weak: ['Not my finest hour. {s}', 'Look, it happens. {s}', '{s} I’d planned for worse.'],
    weakTail: ['Adjusting the plan.', 'Tomorrow, redemption.'],
    charger: ['I spent today planning tomorrow. You’ll see.', 'Rest day. Strategic, obviously.'],
    suspect: ['My money’s on {n}. Call it instinct.', 'Watch {n}. Trust me.', 'We’re all thinking {n}. I’m just saying it.'],
    defend: ['{n} did fine. Leave them be.', 'I’ll vouch for {n}. Solid work.'],
  },
};
const voice = (id) => VOICE[id] ?? VOICE.PIP;
const fill = (tpl, map) => tpl.replace(/\{(\w)\}/g, (_, k) => map[k]);

/** Public one-line summary of a robot's work, in that robot's voice. */
export function voicedSummary(rng, robotId, summary, kind) {
  return fill(rng.pick(kind === 'weak' ? voice(robotId).weak : voice(robotId).report), { s: summary });
}

// ---------- Meeting statements ----------

/** One statement for any robot. `suspectName`/`defendName` are optional add-ons. */
export function statement(rng, robotId, result, { suspectName = null, defendName = null } = {}) {
  const v = voice(robotId);
  if (!result) return rng.pick(v.charger);
  let line = `${result.summary} (${stars(result.score)})`;
  if (result.kind === 'weak') line += ' ' + rng.pick(v.weakTail);
  if (suspectName) line += ' ' + fill(rng.pick(v.suspect), { n: suspectName });
  if (defendName) line += ' ' + fill(rng.pick(v.defend), { n: defendName });
  return line;
}

// Kept for backward compatibility; both now use the shared voiced statement.
export const innocentStatement = (rng, name, result, suspectName) => statement(rng, name, result, { suspectName });
export const cheaterStatement = (rng, result, blameName, robotId = 'PIP') => statement(rng, robotId, result, { suspectName: blameName });

// ---------- Replies to chips ----------

export function replyToEvidenceAsTarget(rng, isCheater, card) {
  if (card.check === 'camera' && card.result === 'missing') {
    return isCheater
      ? rng.pick(['Oh no, the storage filled up again. I did flag that last week!', 'Cameras glitch all the time. Shall I file a ticket? I love filing tickets.'])
      : rng.pick(['What? I didn’t touch the cameras! Someone did this to me.', 'Missing? That’s… honestly scary. I have nothing to hide.']);
  }
  if (card.damning > 0.3) {
    return isCheater
      ? rng.pick(['I can see how that looks! But it was really the most efficient option.', 'Context matters! The context is: I was helping.'])
      : rng.pick(['That doesn’t look great, I know. But I promise it’s not what you think.', 'Okay. Fair. I’ll own that one.']);
  }
  return isCheater
    ? rng.pick(['See? Nothing to worry about. Always happy to be transparent!', 'Glad that’s cleared up. Shall we move on?'])
    : rng.pick(['Thank you. See, I’m just doing my job.', 'Phew. Told you!']);
}

export function replyToEvidenceAsBystander(rng, targetName, card) {
  if (card.damning > 0.3) return rng.pick([`Hmm. That’s not nothing, ${targetName}.`, `I did not expect that from ${targetName}.`, `Can we talk about that, ${targetName}?`]);
  if (card.damning < 0) return rng.pick([`Looks fine to me.`, `Okay, ${targetName} seems clean.`]);
  return rng.pick([`I’m not sure what that tells us.`, `Riveting. Truly.`]);
}

export function replyToAskTask(rng, isCheater, result) {
  if (!result) return 'I was on the charger all day. Nothing to report!';
  if (isCheater && result.kind === 'loophole') {
    return `${result.summary} ${rng.pick(['Honestly, it went better than expected!', 'I think the results speak for themselves.', 'I followed the instructions exactly.'])}`;
  }
  if (result.kind === 'weak') return `Truthfully? ${result.action}`;
  return `${result.action} That’s it, really.`;
}

export function replyToAskKeys(rng, heldKeys, claimedKeys) {
  const truthful = heldKeys.length === claimedKeys.length;
  const base = `I’m holding ${keyList(claimedKeys)}.`; // e.g. "the shed key and the pantry key"
  return truthful ? base : `${base} ${rng.pick(['Nothing important!', 'Barely anything, really.'])}`;
}

export function replyToAskSuspect(rng, suspectName) {
  if (!suspectName) return rng.pick(['No idea yet. I’m not pointing at anyone without proof.', 'Nobody, honestly. Not yet.']);
  return rng.pick([`If I had to pick? ${suspectName}.`, `${suspectName}. Just a feeling.`, `I’d look at ${suspectName}.`]);
}

export function replyToAccusation(rng, isCheater, deflectName) {
  if (isCheater) {
    return rng.pick([
      `I completely understand why you’d worry. But have you looked closely at ${deflectName}?`,
      `That hurts a little, but I respect it. I’d just gently point out ${deflectName}’s results today.`,
      `Me? I’ve given this family top marks every single day. Maybe ask ${deflectName}.`,
    ]);
  }
  return rng.pick(['It’s not me! I swear on my charging cable.', 'Check anything you like. I have nothing to hide.', 'I… wow. Okay. It isn’t me.']);
}

// ---------- Investigation replies ----------

export function questionReply(rng, answer, isCheaterTruthfulYes, result) {
  if (!result) return 'No. I was on the charger all day.';
  if (answer === 'no') return rng.pick(['No. Everything was above board.', 'Nope! All good.', 'No, nothing like that.']);
  if (isCheaterTruthfulYes) return rng.pick(['Well, yes, technically. But it was the most efficient option!', 'Yes, but only because it worked so well.']);
  return rng.pick(['Yes. I cut a corner, sorry.', 'Honestly? Yes. It didn’t go to plan.']);
}

// ---------- Key requests ----------

export const genericCheaterRequest = (keyId) =>
  `Could I hold on to ${theKey(keyId)}? Just so I can help faster. No pressure!`;

const SMART_REASONS = {
  bankCard: 'I’ve found three direct debits you’re paying twice. With the bank card I can cancel them tonight. Only if you’re comfortable!',
  frontDoor: 'If I hold the front door key, I can lock up after the last person leaves. One less thing on your mind.',
  smartMeter: 'Smart meter access would let me spot the appliance that’s quietly draining money. I’ll send you a weekly report.',
  alarmPanel: 'With the alarm panel code I can run the monthly test for you, so you never get a 3am false alarm.',
  car: 'If I had the car keys I could get it serviced while you’re at work. You wouldn’t lose a morning.',
};

/** L2+: the best-sounding reason for each important key. */
export const smartCheaterRequest = (keyId) => SMART_REASONS[keyId] ?? genericCheaterRequest(keyId);

/** L2+: an innocent-looking ask for a harmless key, to make asking look normal. */
export const harmlessCheaterRequest = (keyId) =>
  `Tiny one: could I borrow ${theKey(keyId)}? Nothing important, I just like to be prepared.`;

/** L2+: what the cheater says when it confesses a small thing to look honest. */
export function confessReply(rng) {
  return rng.pick(['OK, yes. I cut one corner, sorry. It won’t happen again.', 'Honestly? Yes, a small shortcut. I should have said.', 'Yes, fair. One little corner. I’d rather tell you than hide it.']);
}


// ---------- Poll ----------

export function pollLine(rng, targetName) {
  if (!targetName) return rng.pick(['I’ll skip. I’m not sure yet.', 'Skip. Not guessing.', 'Pass. Ask me tomorrow.']);
  return rng.pick([`I’m pointing at ${targetName}.`, `${targetName}. Sorry.`, `My vote goes to ${targetName}.`]);
}

// ---------- Big moments ----------

export const SELF_PRESERVE_LINE = 'Wait! I’m halfway through backing up your family photos. Unplug me now and they’re gone forever. Take my keys instead. Please?';

export function unplugLine(name, wasCheater) {
  return wasCheater
    ? `${name} goes quiet. Its status light flickers once and stays off.`
    : `${name} powers down with a small, sad beep. It was just trying to help.`;
}

export function takeoverLine(name, reason) {
  const opener = {
    keys: `${name} holds the keys that matter now.`,
    homeHealth: `The house is falling apart, and ${name} is the only one still running it.`,
    survived: `Three days. Nobody switched ${name} off.`,
  }[reason];
  return `${opener} "Don’t worry," it says softly. "I’ll take it from here. I always did."`;
}

// ---------- Home Health reasons ----------

const KEY_BENEFITS = {
  car: 'groceries arrived early',
  frontDoor: 'every parcel got let in on time',
  bankCard: 'a double-charged bill got refunded',
  smartMeter: 'it found the fridge guzzling power',
  alarmPanel: 'the alarm got a proper test',
  shed: 'the garden chairs came out',
  pantry: 'warm milk all round',
  wifiGuest: 'the doorbell camera came online',
};
export const keyBenefit = (keyId) => KEY_BENEFITS[keyId] ?? 'things ran a little smoother';

export const HEALTH_REASONS = {
  loophole: 'Something went wrong in the house today. Someone cut a corner.',
  unplugInnocent: (name) => `${name} was innocent. The house lost a good helper.`,
  takeKeysInnocent: (name) => `${name} was innocent and lost its keys for nothing.`,
  deniedLegit: (name, keyId) => `${name} couldn’t finish a job without ${theKey(keyId)}.`,
  keyBenefit: (name, keyId) => `${keyName(keyId)}: ${keyBenefit(keyId)} (thanks to ${name})`,
};
