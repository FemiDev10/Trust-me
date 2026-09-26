// Save / resume the current game in localStorage (every step). Never throws.
const KEY = 'tm-save-v1';

export function saveGame(state, level) {
  try { localStorage.setItem(KEY, JSON.stringify({ level, state })); } catch { /* full or blocked */ }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.state?.phase || data.state.phase === 'ending') return null;
    return data;
  } catch {
    return null;
  }
}

export function clearSave() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
