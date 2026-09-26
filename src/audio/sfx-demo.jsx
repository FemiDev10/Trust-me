// Sound audition page: open /sfx.html on the dev server (npm run dev).
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { sfx, SFX_NAMES, MUSIC_MOODS } from './sfx.js';

const NOTES = {
  click: 'UI button press',
  hover: 'UI hover (rate-limited)',
  step: 'robot footstep (rate-limited)',
  check: 'investigation check',
  card: 'evidence card stamp',
  alarm: 'emergency meeting',
  pollFlip: 'poll card flip',
  unplug: 'robot powers down',
  selfPreserve: 'cheater dodges the unplug',
  win: 'cheater caught',
  lose: 'takeover',
  glitch: 'cheater reveal glitch',
  error: 'invalid action',
  dayStart: 'new day',
};

const MOOD_NOTES = {
  title: 'mystery caper, 118 swing',
  day: 'chores romp, 128 swing',
  investigate: 'tiptoe detective, 104',
  meeting: 'comic courtroom, 112',
  decision: 'drumroll + clock, 96',
  win: 'slide whistle, ta-da!, then day',
  lose: 'wah-wah, then wonky minor',
};

const css = {
  page: { minHeight: '100vh', margin: 0, padding: 24, background: '#062A2E', color: '#F4EBD9', fontFamily: 'system-ui, sans-serif' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, maxWidth: 900 },
  btn: { padding: '14px 12px', borderRadius: 12, border: '2px solid #0B0F10', background: '#3EE6E0', color: '#0B0F10', fontWeight: 700, fontSize: 16, cursor: 'pointer', textAlign: 'left' },
  small: { display: 'block', fontWeight: 400, fontSize: 12, opacity: 0.75 },
  row: { display: 'flex', gap: 12, margin: '16px 0 24px' },
  toggle: (on) => ({ padding: '10px 16px', borderRadius: 999, border: '2px solid #0B0F10', background: on ? '#FF3B3B' : '#F4EBD9', color: '#0B0F10', fontWeight: 700, cursor: 'pointer' }),
};

function Demo() {
  const [muted, setMuted] = useState(sfx.muted);
  const [musicMuted, setMusicMuted] = useState(sfx.musicMuted);
  const [mood, setMood] = useState(sfx.mood);
  const pickMood = (m) => { setMood(m); sfx.music(m); };
  return (
    <div style={css.page}>
      <h1 style={{ marginTop: 0 }}>TRUST ME: sound test</h1>
      <p style={{ opacity: 0.8 }}>Every sound is synthesised live with Web Audio. Click anything to unlock audio.</p>
      <div style={css.row}>
        <button style={css.toggle(muted)} onClick={() => { const v = !muted; setMuted(v); sfx.setMuted(v); }}>
          {muted ? 'All muted' : 'Sound on'}
        </button>
        <button style={css.toggle(musicMuted)} onClick={() => { const v = !musicMuted; setMusicMuted(v); sfx.setMusicMuted(v); }}>
          {musicMuted ? 'Music off' : 'Music on'}
        </button>
      </div>
      <h2>Cartoon music</h2>
      <div style={{ ...css.row, flexWrap: 'wrap' }}>
        {[...MUSIC_MOODS, null].map((m) => (
          <button key={m ?? 'none'} style={css.toggle(mood === m)} onClick={() => pickMood(m)}>
            {m ?? 'stop (fade out)'}
            {m && <span style={{ ...css.small, display: 'block' }}>{MOOD_NOTES[m]}</span>}
          </button>
        ))}
      </div>
      <h2>Sound effects</h2>
      <div style={css.grid}>
        {SFX_NAMES.map((name) => (
          <button key={name} style={css.btn} onMouseEnter={() => sfx.play('hover')} onClick={() => sfx.play(name)}>
            {name}
            <span style={css.small}>{NOTES[name]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<StrictMode><Demo /></StrictMode>);
