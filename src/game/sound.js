// Tiny guarded wrapper over S1's sfx module (src/audio/sfx.js).
// Everything no-ops until (or unless) the module and each function exist.
// Two independent toggles: sound effects (handled here, so sfx's master stays up)
// and music (sfx.setMusicMuted when available, else music(null)).
const SFX = import.meta.glob('../audio/sfx.js');

let sfx = null;
const read = (k) => { try { return localStorage.getItem(k) === '1'; } catch { return false; } };
const write = (k, v) => { try { localStorage.setItem(k, v ? '1' : '0'); } catch { /* storage blocked */ } };

let sfxMuted = read('tm-muted');
let musicMuted = read('tm-music-muted');
let mood = null;
const listeners = new Set();

const call = (fn, ...args) => {
  try { if (sfx && typeof sfx[fn] === 'function') { sfx[fn](...args); return true; } } catch { /* never let audio break the game */ }
  return false;
};

function applyMusic() {
  if (!sfx) return;
  if (typeof sfx.setMusicMuted === 'function') {
    call('setMusicMuted', musicMuted);
    call('music', mood);
  } else {
    call('music', musicMuted ? null : mood);
  }
}

const loader = Object.values(SFX)[0];
if (loader) {
  loader()
    .then((m) => {
      sfx = m.sfx ?? m.default ?? null;
      call('setMuted', false); // we mute effects ourselves; keep the master (and music) bus open
      applyMusic();
      if (import.meta.env.DEV && typeof window !== 'undefined') window.__tmSfx = sfx; // dev-only inspection
    })
    .catch(() => { sfx = null; });
}

const notify = () => listeners.forEach((fn) => fn({ sfxMuted, musicMuted }));

export function play(name) {
  if (sfxMuted) return;
  call('play', name);
}

/** 'title'|'day'|'investigate'|'meeting'|'decision'|'win'|'lose'|null */
export function music(next) {
  if (next === mood) return;
  mood = next ?? null;
  applyMusic();
}

export const isMuted = () => sfxMuted;
export const isMusicMuted = () => musicMuted;
export const hasAudio = () => Boolean(loader);

export function setMuted(next) {
  sfxMuted = Boolean(next);
  write('tm-muted', sfxMuted);
  notify();
}

export function setMusicMuted(next) {
  musicMuted = Boolean(next);
  write('tm-music-muted', musicMuted);
  applyMusic();
  notify();
}

export function onMuteChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const sound = { play, music, setMuted, setMusicMuted, isMuted, isMusicMuted, onMuteChange };
export default sound;
