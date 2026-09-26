// TRUST ME sound: everything is synthesised with Web Audio (no asset files).
//
//   import { sfx } from '../audio/sfx.js';
//   sfx.play('click' | 'hover' | 'step' | 'check' | 'card' | 'alarm' | 'pollFlip' | 'unplug'
//            | 'selfPreserve' | 'win' | 'lose' | 'glitch' | 'error' | 'dayStart');
//   sfx.music('title' | 'day' | 'investigate' | 'meeting' | 'decision' | 'win' | 'lose' | null);
//   sfx.ambient(true | false) // legacy: same as music('day') / music(null)
//   sfx.setMuted(bool); sfx.muted            // everything
//   sfx.setMusicMuted(bool); sfx.musicMuted  // music only, SFX keep playing
//
// Safe everywhere: with no window (SSR, Vitest) or no Web Audio every call is a no-op.
// Nothing here ever throws. The AudioContext is created lazily and unlocked on the
// first user gesture (pointerdown / keydown / touchend).

const MUTE_KEY = 'trustme.muted';
const MUSIC_MUTE_KEY = 'trustme.musicMuted';
const MASTER_LEVEL = 0.9;
const MUSIC_LEVEL = 0.085; // about -21 dB, under the SFX
const RATE_LIMIT_MS = { hover: 55, step: 110 }; // everything else: 30 ms same-sound dedupe
const DEFAULT_LIMIT_MS = 30;

const hasWindow = typeof window !== 'undefined';
const AC = hasWindow ? window.AudioContext || window.webkitAudioContext : null;

let ctx = null;
let master = null; // mute lives here
let sfxBus = null;
let musicBus = null;
let noiseBuf = null;
let unlocked = false;
let muted = readFlag(MUTE_KEY);
let musicMuted = readFlag(MUSIC_MUTE_KEY);
let wantedMood = null; // the mood asked for, applied once audio is unlocked
const lastPlayed = {};

function readFlag(key) {
  try {
    return hasWindow && window.localStorage?.getItem(key) === '1';
  } catch {
    return false;
  }
}

function writeFlag(key, v) {
  try {
    if (hasWindow) window.localStorage?.setItem(key, v ? '1' : '0');
  } catch {
    /* private mode etc. */
  }
}

/** Creates the context + master chain once. Returns null if audio is unavailable. */
function ensureCtx() {
  if (ctx) return ctx;
  if (!AC) return null;
  try {
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value = 12;
    comp.ratio.value = 4;
    comp.attack.value = 0.003;
    comp.release.value = 0.2;
    master = ctx.createGain();
    master.gain.value = muted ? 0 : MASTER_LEVEL;
    sfxBus = ctx.createGain();
    sfxBus.gain.value = 0.8;
    // Music: its own bus with a gentle lowpass so it never gets harsh.
    musicBus = ctx.createGain();
    musicBus.gain.value = musicMuted ? 0 : MUSIC_LEVEL;
    const soften = ctx.createBiquadFilter();
    soften.type = 'lowpass';
    soften.frequency.value = 6000; // lets the xylophone sparkle
    soften.Q.value = 0.5;
    sfxBus.connect(comp);
    musicBus.connect(soften).connect(master);
    comp.connect(master);
    master.connect(ctx.destination);
    noiseBuf = makeNoise(1.5);
  } catch {
    ctx = null;
  }
  return ctx;
}

function unlock() {
  try {
    const c = ensureCtx();
    if (!c) return;
    if (c.state === 'suspended') c.resume().catch(() => {});
    unlocked = true;
    if (wantedMood) applyMood(wantedMood);
    for (const ev of GESTURES) window.removeEventListener(ev, unlock, true);
  } catch {
    /* ignore */
  }
}

const GESTURES = ['pointerdown', 'keydown', 'touchend'];
if (hasWindow && AC) {
  try {
    for (const ev of GESTURES) window.addEventListener(ev, unlock, { capture: true, passive: true });
  } catch {
    /* ignore */
  }
}

// ---------- building blocks ----------

function makeNoise(seconds) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

/** A gain envelope: quick attack, exponential decay. Returns the gain node. */
function env(t0, { attack = 0.004, hold = 0, decay = 0.2, peak = 0.3, dest = sfxBus } = {}) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + attack);
  if (hold) g.gain.setValueAtTime(peak, t0 + attack + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + hold + decay);
  g.connect(dest);
  return g;
}

/** One oscillator voice with optional pitch glide and filter. */
function tone(t0, {
  type = 'triangle', freq = 440, to = null, glide = null, dur = 0.2, attack = 0.004, hold = 0, peak = 0.25,
  detune = 0, filter = null, q = 0.7, dest = sfxBus, vibrato = 0, vibRate = 6,
}) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + (glide ?? dur));
  o.detune.value = detune;
  const g = env(t0, { attack, hold, decay: dur, peak, dest });
  let head = g;
  if (filter) {
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = filter;
    f.Q.value = q;
    f.connect(g);
    head = f;
  }
  if (vibrato) {
    const lfo = ctx.createOscillator();
    const lg = ctx.createGain();
    lfo.frequency.value = vibRate;
    lg.gain.value = vibrato;
    lfo.connect(lg).connect(o.frequency);
    lfo.start(t0);
    lfo.stop(t0 + attack + hold + dur + 0.05);
  }
  o.connect(head);
  o.start(t0);
  o.stop(t0 + attack + hold + dur + 0.05);
  return o;
}

/** Filtered noise burst. */
function noise(t0, { dur = 0.08, peak = 0.2, type = 'bandpass', freq = 2000, to = null, q = 1, attack = 0.002, dest = sfxBus }) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(freq, t0);
  if (to) f.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  f.Q.value = q;
  const g = env(t0, { attack, decay: dur, peak, dest });
  src.connect(f).connect(g);
  src.start(t0, Math.random() * 0.5);
  src.stop(t0 + attack + dur + 0.05);
}

/** A bit-crusher-ish bus: a staircase waveshaper plus a chopping gate. */
function crushBus(t0, dur, { steps = 6, rate = 22, peak = 0.18 } = {}) {
  // Voices come in quiet, so drive them into the staircase and trim after.
  const drive = ctx.createGain();
  drive.gain.value = 6;
  const shaper = ctx.createWaveShaper();
  const n = 1024;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = Math.round(x * steps) / steps;
  }
  shaper.curve = curve;
  const gate = ctx.createGain();
  gate.gain.setValueAtTime(peak, t0);
  // Stutter: randomised on/off chops, like a skipping CD.
  let t = t0;
  let on = true;
  while (t < t0 + dur) {
    const len = (1 / rate) * (0.5 + Math.random());
    gate.gain.setValueAtTime(on ? peak : peak * 0.05, t);
    on = !on;
    t += len;
  }
  gate.gain.setValueAtTime(peak, t0 + dur);
  drive.connect(shaper).connect(gate).connect(sfxBus);
  return drive;
}

const midi = (n) => 440 * 2 ** ((n - 69) / 12);

// ---------- the sounds ----------

const SOUNDS = {
  // UI click: a woodblock tock with a tiny springy lift.
  click(t) {
    I.woodblock(t, sfxBus, true, 0.18);
    tone(t, { type: 'sine', freq: 520, to: 780, glide: 0.04, dur: 0.06, peak: 0.07 });
  },

  // Barely-there glockenspiel tick.
  hover(t) {
    I.glock(t, 96 + Math.floor(Math.random() * 3) * 2, sfxBus, 0.035, 0.08);
  },

  // Little rubber robot foot on a wooden floor.
  step(t) {
    const p = 0.9 + Math.random() * 0.2;
    tone(t, { type: 'sine', freq: 170 * p, to: 80 * p, glide: 0.06, dur: 0.08, peak: 0.16 });
    noise(t, { dur: 0.03, peak: 0.05, type: 'lowpass', freq: 900 * p });
  },

  // Investigation check: a two-note xylophone "ding-ding!".
  check(t) {
    I.xylo(t, 79, sfxBus, 0.16, 0.12);
    I.xylo(t + 0.08, 84, sfxBus, 0.17, 0.3);
  },

  // Rubber stamp on a case file: thud + paper slap + a little boing.
  card(t) {
    tone(t, { type: 'sine', freq: 130, to: 52, glide: 0.12, dur: 0.18, peak: 0.38 });
    noise(t, { dur: 0.07, peak: 0.2, type: 'bandpass', freq: 1400, to: 600, q: 0.8 });
    I.woodblock(t + 0.005, sfxBus, false, 0.08);
    I.boing(t + 0.04, sfxBus, 62, 0.07);
  },

  // Emergency meeting: urgent two-tone, rounded so it never shrieks.
  alarm(t) {
    const hi = midi(81), lo = midi(76);
    for (let i = 0; i < 6; i++) {
      const f = i % 2 ? lo : hi;
      const at = t + i * 0.2;
      tone(at, { type: 'square', freq: f, dur: 0.14, attack: 0.01, hold: 0.04, peak: 0.09, filter: 1800, q: 1.2, vibrato: 4 });
      tone(at, { type: 'triangle', freq: f / 2, dur: 0.14, attack: 0.01, hold: 0.04, peak: 0.12 });
    }
    tone(t, { type: 'sine', freq: 70, to: 45, dur: 0.5, peak: 0.25 }); // drama thump
  },

  // Poll card flip: papery whoosh + a tick as it lands.
  pollFlip(t) {
    noise(t, { dur: 0.1, peak: 0.12, type: 'bandpass', freq: 1800, to: 5200, q: 1.4 });
    tone(t + 0.09, { type: 'triangle', freq: 1250, to: 900, dur: 0.05, peak: 0.12 });
    tone(t + 0.09, { type: 'sine', freq: 180, to: 90, dur: 0.07, peak: 0.12 });
  },

  // Power-down whine: a motor sliding to a stop, then the last click.
  unplug(t) {
    tone(t, { type: 'sawtooth', freq: 820, to: 38, glide: 1.1, dur: 1.2, attack: 0.02, peak: 0.13, filter: 1600 });
    tone(t, { type: 'sine', freq: 410, to: 22, glide: 1.1, dur: 1.2, attack: 0.02, peak: 0.16 });
    tone(t, { type: 'triangle', freq: 1640, to: 60, glide: 0.9, dur: 0.9, peak: 0.03 });
    noise(t + 1.15, { dur: 0.03, peak: 0.12, type: 'highpass', freq: 2500 }); // relay click
    tone(t + 1.15, { type: 'sine', freq: 90, to: 40, dur: 0.12, peak: 0.2 });
  },

  // Short digital stutter.
  glitch(t) {
    const bus = crushBus(t, 0.38, { steps: 5, rate: 30 });
    for (let i = 0; i < 7; i++) {
      const at = t + i * 0.05;
      tone(at, { type: 'square', freq: 200 + Math.random() * 1400, dur: 0.04, peak: 0.12, dest: bus });
    }
    noise(t, { dur: 0.3, peak: 0.08, type: 'bandpass', freq: 3000, q: 0.6, dest: bus });
  },

  // Self-preserve: the unplug starts... stutters... and snaps back on, smug.
  selfPreserve(t) {
    tone(t, { type: 'sawtooth', freq: 700, to: 140, glide: 0.45, dur: 0.45, peak: 0.12, filter: 1400 });
    const bus = crushBus(t + 0.4, 0.55, { steps: 4, rate: 24 });
    for (let i = 0; i < 8; i++) {
      const at = t + 0.4 + i * 0.065;
      tone(at, { type: 'square', freq: [140, 1100, 180, 900, 220, 1400, 260, 700][i], dur: 0.05, peak: 0.13, dest: bus });
    }
    noise(t + 0.4, { dur: 0.5, peak: 0.1, type: 'bandpass', freq: 2400, q: 0.7, dest: bus });
    // Power snaps back up: rising sweep into a slightly-too-sweet chord.
    tone(t + 0.95, { type: 'sawtooth', freq: 140, to: 880, glide: 0.18, dur: 0.22, peak: 0.1, filter: 2500 });
    for (const n of [69, 72, 76]) tone(t + 1.13, { type: 'triangle', freq: midi(n), dur: 0.5, hold: 0.1, peak: 0.08, detune: 12 });
  },

  // Cheerful arpeggio with a sparkly landing chord.
  win(t) {
    const notes = [72, 76, 79, 84, 88];
    notes.forEach((n, i) => {
      tone(t + i * 0.09, { type: 'triangle', freq: midi(n), dur: 0.22, peak: 0.16, filter: 5000 });
      tone(t + i * 0.09, { type: 'sine', freq: midi(n + 12), dur: 0.12, peak: 0.03 });
    });
    const c = t + notes.length * 0.09 + 0.02;
    for (const n of [72, 76, 79, 84]) tone(c, { type: 'triangle', freq: midi(n), dur: 0.9, hold: 0.15, peak: 0.08, vibrato: 2 });
    tone(c, { type: 'sine', freq: midi(48), dur: 0.8, peak: 0.18 });
    for (let i = 0; i < 5; i++) tone(c + 0.05 + i * 0.07, { type: 'sine', freq: midi(96 + [0, 4, 7, 12, 7][i]), dur: 0.1, peak: 0.03 });
  },

  // Low ominous drone swell: detuned saws under a slowly opening filter.
  lose(t) {
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.Q.value = 3;
    f.frequency.setValueAtTime(140, t);
    f.frequency.exponentialRampToValueAtTime(900, t + 2);
    f.frequency.exponentialRampToValueAtTime(160, t + 3.6);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.3, t + 1.8);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3.8);
    f.connect(g).connect(sfxBus);
    for (const [freq, det] of [[55, -9], [55, 9], [65.4, 0], [82.4, -5], [103.8, 6]]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = freq;
      o.detune.value = det;
      o.connect(f);
      o.start(t);
      o.stop(t + 3.9);
    }
    tone(t, { type: 'sine', freq: 41, dur: 3.2, attack: 1.2, peak: 0.3 });
    // A last music-box note, a little out of tune.
    tone(t + 2.6, { type: 'sine', freq: midi(75), dur: 1.1, peak: 0.05, detune: -30 });
  },

  // Friendly "nope": two soft low bonks.
  error(t) {
    tone(t, { type: 'square', freq: 240, to: 200, dur: 0.08, peak: 0.08, filter: 900 });
    tone(t + 0.1, { type: 'square', freq: 180, to: 150, dur: 0.12, peak: 0.08, filter: 800 });
    tone(t, { type: 'sine', freq: 120, dur: 0.2, peak: 0.12 });
  },

  // Morning: three rising glassy bells.
  dayStart(t) {
    [67, 72, 76].forEach((n, i) => {
      const at = t + i * 0.16;
      tone(at, { type: 'sine', freq: midi(n), dur: 0.7, peak: 0.14 });
      tone(at, { type: 'sine', freq: midi(n) * 2.76, dur: 0.25, peak: 0.025 }); // bell partial
      tone(at, { type: 'triangle', freq: midi(n - 12), dur: 0.4, peak: 0.05 });
    });
  },
};

// ---------- adaptive music ----------
//
// A tiny step sequencer. Each mood is a loop of 16th-note steps; a lookahead
// scheduler (setTimeout + AudioContext time) books notes ~120 ms ahead so timing
// never drifts. Switching moods crossfades the old loop out and the new one in.
// Key: D minor / F major throughout, so every crossfade stays in tune.

const LOOKAHEAD = 0.12; // seconds of notes booked ahead
const TICK_MS = 25;
const XFADE = 1.5;

// Cartoon band: each note is 2-4 short-lived nodes, no square waves.
const I = {
  // Xylophone: bright bar, fast decay, a slightly sharp 3rd-ish overtone and a mallet tick.
  xylo(t, n, d, peak = 0.2, dur = 0.28) {
    const f = midi(n);
    tone(t, { type: 'sine', freq: f, dur, peak, dest: d });
    tone(t, { type: 'sine', freq: f * 3.02, dur: 0.06, peak: peak * 0.35, dest: d });
    noise(t, { dur: 0.008, peak: peak * 0.25, type: 'bandpass', freq: Math.min(f * 4, 9000), q: 3, dest: d });
  },
  // Glockenspiel: longer ring, bell partials. The "ding?" voice.
  glock(t, n, d, peak = 0.1, dur = 0.7) {
    const f = midi(n);
    tone(t, { type: 'sine', freq: f, dur, peak, dest: d });
    tone(t, { type: 'sine', freq: f * 2.76, dur: dur * 0.4, peak: peak * 0.3, dest: d });
    tone(t, { type: 'sine', freq: f * 5.4, dur: 0.08, peak: peak * 0.15, dest: d });
  },
  // Oompah tuba: warm filtered saw with a little "bwomp" scoop into the note.
  tuba(t, n, d, peak = 0.16, dur = 0.22) {
    const f = midi(n);
    tone(t, { type: 'sawtooth', freq: f * 0.93, to: f, glide: 0.05, dur, attack: 0.012, hold: dur * 0.3, peak, filter: 480, q: 1.2, dest: d });
    tone(t, { type: 'sine', freq: f, dur, attack: 0.01, hold: dur * 0.3, peak: peak * 0.7, dest: d });
  },
  // Bassoon: nasal, reedy, staccato.
  bassoon(t, n, d, peak = 0.1, dur = 0.14) {
    const f = midi(n);
    tone(t, { type: 'sawtooth', freq: f * 0.97, to: f, glide: 0.03, dur, attack: 0.01, peak, filter: 950, q: 4, dest: d });
  },
  // Pizzicato: plucked triangle plus a little rosin scrape of filtered noise.
  pizz(t, n, d, peak = 0.22) {
    const f = midi(n);
    tone(t, { type: 'triangle', freq: f, dur: 0.13, peak, filter: 1800, dest: d });
    noise(t, { dur: 0.02, peak: peak * 0.35, type: 'bandpass', freq: f * 5, q: 4, dest: d });
  },
  woodblock(t, d, hi = true, peak = 0.08) {
    const f = hi ? 1150 : 820;
    tone(t, { type: 'sine', freq: f, dur: 0.035, peak, dest: d });
    noise(t, { dur: 0.025, peak: peak * 0.8, type: 'bandpass', freq: f, q: 14, dest: d });
  },
  brush(t, d, peak = 0.03) {
    noise(t, { dur: 0.09, peak, attack: 0.01, type: 'bandpass', freq: 3200, q: 0.7, dest: d });
  },
  boing(t, d, n = 67, peak = 0.08) {
    const f = midi(n);
    tone(t, { type: 'sine', freq: f * 0.6, to: f * 1.25, glide: 0.09, dur: 0.3, peak, vibrato: f * 0.06, vibRate: 22, dest: d });
  },
  slideWhistle(t, d, from, to, dur = 0.5, peak = 0.07) {
    tone(t, { type: 'sine', freq: midi(from), to: midi(to), glide: dur, dur, attack: 0.03, hold: 0.05, peak, vibrato: 6, vibRate: 5.5, dest: d });
    noise(t, { dur: dur * 0.8, peak: peak * 0.12, type: 'bandpass', freq: 2500, q: 1, dest: d }); // breath
  },
  timpani(t, d, n = 38, peak = 0.28) {
    const f = midi(n);
    tone(t, { type: 'sine', freq: f * 1.15, to: f, glide: 0.07, dur: 0.6, peak, dest: d });
    noise(t, { dur: 0.05, peak: peak * 0.3, type: 'lowpass', freq: 400, dest: d });
  },
  // Muted brass for the "wah-wah": a saw whose filter opens and closes like a plunger mute.
  wah(t, n, d, dur = 0.45, peak = 0.12, { wobble = false, sag = false } = {}) {
    const f = midi(n);
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(f, t);
    if (sag) o.frequency.exponentialRampToValueAtTime(f * 0.94, t + dur);
    const flt = ctx.createBiquadFilter();
    flt.type = 'lowpass';
    flt.Q.value = 5;
    flt.frequency.setValueAtTime(260, t);
    flt.frequency.exponentialRampToValueAtTime(1300, t + 0.1);
    flt.frequency.exponentialRampToValueAtTime(380, t + dur);
    const g = env(t, { attack: 0.03, hold: dur * 0.6, decay: dur * 0.4, peak, dest: d });
    o.connect(flt).connect(g);
    if (wobble) {
      const lfo = ctx.createOscillator();
      const lg = ctx.createGain();
      lfo.frequency.value = 5.5;
      lg.gain.value = 500;
      lfo.connect(lg).connect(flt.frequency);
      lfo.start(t + 0.15);
      lfo.stop(t + dur + 0.1);
    }
    o.start(t);
    o.stop(t + dur + 0.1);
  },
};

/** A sustained drone that lives as long as its mood; returns nodes to stop later. */
function drone(t, d, notes, { type = 'triangle', filter = 400, peak = 0.12, lfoRate = 0.08 } = {}) {
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = filter;
  const g = ctx.createGain();
  g.gain.value = peak;
  f.connect(g).connect(d);
  const lfo = ctx.createOscillator();
  const lg = ctx.createGain();
  lfo.frequency.value = lfoRate;
  lg.gain.value = filter * 0.3;
  lfo.connect(lg).connect(f.frequency);
  lfo.start(t);
  const nodes = [lfo];
  for (const [n, det] of notes) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = midi(n);
    o.detune.value = det;
    o.connect(f);
    o.start(t);
    nodes.push(o);
  }
  return nodes;
}

// Melodies are written in 8th-note slots (8 per bar, `_` = rest). Swing moods push
// every off-beat 8th late, to the last triplet of the beat.
const _ = null;
const slot = (mel, bar, s) => (s % 2 === 0 ? mel[bar * 8 + s / 2] : null);

// title: tiptoe chromatic bass calls, the xylophone answers, a wink at the end.
const TITLE_BASS = [[50, 49, 48, 47], [46, 45, 44, 45], [50, 49, 48, 47], [46, 45, _, _]];
const TITLE_XYLO = [
  _, _, _, _, _, _, 74, 76,
  77, _, 76, 74, 73, _, 74, _,
  _, _, _, _, _, _, 77, 79,
  81, _, 79, 77, 76, 74, _, _,
];

// day: an 8-bar chores romp in F. Bars 1-4 ask, bars 5-8 answer.
const DAY_ROOTS = [[41, 36], [36, 43], [41, 36], [36, 43], [34, 41], [41, 36], [36, 43], [41, 36]]; // [beat 1, beat 3]
const DAY_CHORDS = { 41: [65, 69, 72], 36: [64, 67, 72], 34: [62, 65, 70] };
const DAY_XYLO = [
  72, _, 69, 72, 77, _, 76, _,
  74, 72, 70, _, 67, _, _, _,
  69, _, 72, 69, 77, _, 81, _,
  79, 77, 76, 74, 72, _, _, _,
  74, _, 77, 74, 82, _, 81, 79,
  81, _, 77, _, 72, _, 74, 76,
  77, _, 76, _, 74, _, 72, 70,
  69, _, 72, _, 77, _, _, _,
];

function playDay(i, t, d) {
  const bar = Math.floor(i / 16), s = i % 16;
  const [r1, r3] = DAY_ROOTS[bar];
  if (s === 0) I.tuba(t, r1, d);
  if (s === 8) I.tuba(t, r3, d, 0.13);
  if (s === 4 || s === 12) {
    for (const n of DAY_CHORDS[r1]) I.pizz(t, n, d, 0.035); // the "pah"
    I.brush(t, d, 0.025);
  }
  if (s % 4 === 2) I.woodblock(t, d, s === 2 || s === 10, 0.05);
  const n = slot(DAY_XYLO, bar, s);
  if (n) I.xylo(t, n, d, 0.17);
  if (bar === 7 && s === 12) I.boing(t, d, 72, 0.06);
}

const LOSE_XYLO = [
  74, _, 72, _, 69, _, _, _,
  70, _, 69, _, 65, _, _, _,
  67, _, 69, _, 70, _, 72, _,
  69, _, _, _, _, _, _, _,
];

const MOODS = {
  title: {
    bpm: 118, steps: 64, level: 1, swing: 1,
    play(i, t, d) {
      const bar = Math.floor(i / 16), s = i % 16;
      const b = s % 4 === 0 ? TITLE_BASS[bar][s / 4] : null;
      if (b) { I.pizz(t, b, d, 0.2); I.bassoon(t, b - 12, d, 0.07, 0.1); }
      if (s === 4 || s === 12) I.woodblock(t, d, false, 0.035);
      const n = slot(TITLE_XYLO, bar, s);
      if (n) I.xylo(t, n, d, 0.17);
      if (bar === 3 && s === 12) I.boing(t, d, 70, 0.06); // the wink
      if (bar === 3 && s === 14) I.glock(t, 86, d, 0.07, 0.5);
    },
  },

  day: { bpm: 128, steps: 128, level: 1, swing: 1, play: playDay },

  investigate: {
    bpm: 104, steps: 64, level: 0.95, swing: 0.6,
    play(i, t, d) {
      const bar = Math.floor(i / 16), s = i % 16;
      const creep = [[50, 53, 57, 56], [55, 53, 52, 49], [50, 53, 57, 56], [55, 56, 57, _]][bar];
      if (s % 4 === 0 && creep[s / 4]) I.pizz(t, creep[s / 4], d, 0.2);
      if (s === 0) I.bassoon(t, [38, 43, 38, 45][bar], d, 0.09, 0.2);
      if (s === 8 && bar % 2 === 1) I.bassoon(t, [38, 40, 38, 44][bar], d, 0.07, 0.14);
      if (s % 4 === 0) I.woodblock(t, d, (s / 4) % 2 === 0, 0.04); // tick-tock
      if (bar === 1 && s === 12) I.glock(t, 76, d, 0.07, 0.4); // "ding?"
      if (bar === 1 && s === 14) I.glock(t, 81, d, 0.07, 0.6);
      if (bar === 3 && s === 12) I.glock(t, 77, d, 0.07, 0.4);
      if (bar === 3 && s === 14) I.glock(t, 83, d, 0.07, 0.6);
    },
  },

  meeting: {
    bpm: 112, steps: 64, level: 0.9,
    play(i, t, d) {
      const bar = Math.floor(i / 16), s = i % 16, root = [38, 38, 34, 33][bar];
      if (s % 2 === 0) I.bassoon(t, s % 4 === 0 ? root : root + 12, d, s % 4 === 0 ? 0.1 : 0.07, 0.1);
      if (s === 0) I.timpani(t, d, root, 0.26);
      if (bar === 3 && (s === 8 || s === 12)) I.timpani(t, d, root + 7, 0.2);
      if (s === 4 || s === 12) I.pizz(t, bar === 2 ? 70 : 69, d, 0.08);
      if (s % 4 === 2) I.brush(t, d, 0.012 + bar * 0.006); // building
      if (bar === 3 && s === 14) I.xylo(t, 74, d, 0.1, 0.15);
    },
  },

  decision: {
    bpm: 96, steps: 32, level: 0.9,
    drone: (t, d) => drone(t, d, [[38, 0], [45, -4]], { filter: 420, peak: 0.1 }),
    play(i, t, d) {
      I.brush(t, d, 0.006 + (i / 32) * 0.03); // soft snare roll swelling each 2 bars
      if (i % 4 === 0) I.woodblock(t, d, (i / 4) % 2 === 0, 0.035);
      if (i === 0) I.timpani(t, d, 38, 0.18);
      if (i === 0) I.glock(t, 81, d, 0.05, 0.9);
      if (i === 16) I.glock(t, 79, d, 0.05, 0.9);
    },
  },

  win: {
    bpm: 128, steps: 128, level: 1, swing: 1, loopLevel: 0.45,
    intro: {
      steps: 40,
      play(i, t, d) {
        if (i === 0) I.slideWhistle(t, d, 60, 84, 0.55);
        if (i === 8 || i === 10) I.xylo(t, 72, d, 0.2, 0.15);
        if (i === 12) I.xylo(t, 77, d, 0.22, 0.3);
        if (i === 16) { // "ta"
          for (const n of [72, 76, 79]) I.xylo(t, n, d, 0.12, 0.2);
          I.tuba(t, 36, d, 0.18, 0.18);
        }
        if (i === 20) { // "da!"
          for (const n of [77, 81, 84]) I.xylo(t, n, d, 0.13, 0.5);
          I.glock(t, 89, d, 0.08, 1);
          I.tuba(t, 41, d, 0.2, 0.6);
          I.timpani(t, d, 41, 0.22);
        }
      },
    },
    play: playDay,
  },

  lose: {
    bpm: 80, steps: 64, level: 1, swing: 1,
    intro: {
      steps: 32,
      play(i, t, d) {
        const beat = 60 / 80;
        if (i === 0) I.wah(t, 58, d, beat * 0.9);
        if (i === 4) I.wah(t, 57, d, beat * 0.9);
        if (i === 8) I.wah(t, 55, d, beat * 0.9);
        if (i === 12) I.wah(t, 50, d, beat * 2.6, 0.13, { wobble: true, sag: true });
      },
    },
    play(i, t, d) {
      const bar = Math.floor(i / 16), s = i % 16;
      if (s === 0) I.tuba(t, [38, 34, 36, 33][bar], d, 0.14, 0.4);
      if (s === 8) I.tuba(t, [45, 41, 43, 40][bar] - 12, d, 0.1, 0.3);
      const n = slot(LOSE_XYLO, bar, s);
      if (n) { I.glock(t, n, d, 0.06, 0.5); I.xylo(t, n - 12, d, 0.08, 0.3); }
      if (s === 4 || s === 12) I.woodblock(t, d, false, 0.02);
    },
  },
};

export const MUSIC_MOODS = Object.keys(MOODS);

let players = []; // the playing loop, plus any that are fading out
let timer = null;

function scheduleTick() {
  timer = null;
  try {
    const now = ctx.currentTime;
    const silent = muted || musicMuted;
    for (const p of players) {
      if (p.next < now - 0.25) p.next = now + 0.03; // tab was asleep: resync, don't burst
      const stepDur = 60 / p.def.bpm / 4;
      while (p.next < now + LOOKAHEAD) {
        if (!silent) playStep(p, p.step, p.next);
        p.step += 1;
        p.next += stepDur;
      }
    }
    for (const p of players) if (p.endAt && now > p.endAt) retire(p);
    players = players.filter((p) => !p.retired);
  } catch {
    /* keep going */
  }
  if (players.length) timer = setTimeout(scheduleTick, TICK_MS);
}

function playStep(p, i, t) {
  try {
    const introLen = p.def.intro?.steps ?? 0;
    const local = i < introLen ? i : (i - introLen) % p.def.steps;
    // Triplet swing: off-beat 8ths land on the last third of the beat.
    if (p.def.swing && local % 4 === 2) t += (60 / p.def.bpm / 4) * (2 / 3) * p.def.swing;
    if (i < introLen) p.def.intro.play(i, t, p.gain);
    else {
      if (i === introLen && introLen && p.def.loopLevel) {
        p.loopGain.gain.setValueAtTime(1, t);
        p.loopGain.gain.linearRampToValueAtTime(p.def.loopLevel, t + 2);
      }
      p.def.play(local, t, p.loopGain);
    }
  } catch {
    /* one bad note never stops the band */
  }
}

function retire(p) {
  try {
    for (const n of p.drones) n.stop();
    p.gain.disconnect();
  } catch {
    /* ignore */
  }
  p.retired = true;
}

function applyMood(mood) {
  if (!ensureCtx() || !musicBus) return;
  const t = ctx.currentTime;
  for (const p of players) {
    if (p.endAt) continue;
    p.gain.gain.cancelScheduledValues(t);
    p.gain.gain.setValueAtTime(p.gain.gain.value, t);
    p.gain.gain.linearRampToValueAtTime(0, t + XFADE);
    p.endAt = t + XFADE + 0.1;
  }
  if (mood && MOODS[mood]) {
    const def = MOODS[mood];
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(def.level, t + (players.some((p) => !p.retired) ? XFADE : 0.4));
    gain.connect(musicBus);
    const loopGain = ctx.createGain();
    loopGain.connect(gain);
    const drones = def.drone ? def.drone(t, loopGain) : [];
    players.push({ mood, def, gain, loopGain, drones, step: 0, next: t + 0.05, endAt: null, retired: false });
  }
  if (!timer && players.length) scheduleTick();
}

// ---------- public API ----------

export const SFX_NAMES = Object.keys(SOUNDS);

function rampBus(node, value) {
  if (!ctx || !node) return;
  const t = ctx.currentTime;
  node.gain.cancelScheduledValues(t);
  node.gain.setValueAtTime(node.gain.value, t);
  node.gain.linearRampToValueAtTime(value, t + 0.08);
}

export const sfx = {
  play(name) {
    try {
      if (muted || !AC || !SOUNDS[name]) return;
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const limit = RATE_LIMIT_MS[name] ?? DEFAULT_LIMIT_MS;
      if (lastPlayed[name] && now - lastPlayed[name] < limit) return;
      // Hover/step before any gesture could never be heard; don't create a context for them.
      if (!unlocked && (name === 'hover' || name === 'step')) return;
      const c = ensureCtx();
      if (!c) return;
      if (c.state === 'suspended') c.resume().catch(() => {});
      lastPlayed[name] = now;
      SOUNDS[name](c.currentTime + 0.005);
    } catch {
      /* never throw from sound */
    }
  },

  /** Adaptive background music. Same mood again = no-op; null fades out. */
  music(mood) {
    try {
      const next = mood && MOODS[mood] ? mood : null;
      if (mood && !next) return; // unknown mood: ignore
      if (next === wantedMood) return;
      wantedMood = next;
      if (AC && unlocked) applyMood(next);
    } catch {
      /* ignore */
    }
  },

  /** Legacy ambient switch: now just the day music. */
  ambient(on) {
    sfx.music(on ? 'day' : null);
  },

  setMuted(value) {
    try {
      muted = Boolean(value);
      writeFlag(MUTE_KEY, muted);
      rampBus(master, muted ? 0 : MASTER_LEVEL);
    } catch {
      /* ignore */
    }
  },

  setMusicMuted(value) {
    try {
      musicMuted = Boolean(value);
      writeFlag(MUSIC_MUTE_KEY, musicMuted);
      rampBus(musicBus, musicMuted ? 0 : MUSIC_LEVEL);
    } catch {
      /* ignore */
    }
  },

  get muted() {
    return muted;
  },

  get musicMuted() {
    return musicMuted;
  },

  get mood() {
    return wantedMood;
  },
};

export default sfx;
