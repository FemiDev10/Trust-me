// Guarded bridge to src/audio/sfx.js (built in parallel). No-ops if it is missing or throws.
const mods = import.meta.glob('../../audio/sfx.js', { eager: true });
const sfxMod = Object.values(mods)[0];

export function play(name) {
  try {
    sfxMod?.sfx?.play?.(name);
  } catch {
    /* audio is optional */
  }
}

export const sound = { play };
export default sound;
