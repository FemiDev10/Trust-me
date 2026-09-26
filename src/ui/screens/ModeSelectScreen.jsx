import { useState } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import { play } from '../../game/sound.js';
import Icon from '../hud/icons.jsx';
import './ModeSelect.css';
import { castWord, CAST_COUNT } from '../../game/copy.js';
import { LEVELS, isUnlocked, isSolved } from '../../game/levels.js';

const MODES = [
  { id: 'home', no: '0927-H', name: 'Home', icon: 'home', tag: `${castWord} house robots. One cheats.`, stats: [['Suspects', String(CAST_COUNT)], ['Rounds', '3'], ['Time', '~10 min']], locked: false },
  { id: 'hospital', no: '1103-W', name: 'Hospital', icon: 'hospital', tag: 'Ward bots with access to everything.', stats: [['Suspects', '?'], ['Shift', 'Night']], locked: true },
  { id: 'office', no: '0412-Q', name: 'Office', icon: 'office', tag: 'An AI team that “always hits target”.', stats: [['Suspects', '?'], ['Deadline', 'Q4']], locked: true },
];

function ModeCard({ mode, index, onPlay }) {
  const controls = useAnimationControls();
  const [hover, setHover] = useState(false);
  const click = () => {
    if (mode.locked) {
      play('error');
      controls.start({ x: [0, -12, 10, -6, 4, 0], transition: { duration: 0.45 } });
      return;
    }
    play('click');
    onPlay(mode.id);
  };
  return (
    <motion.div
      initial={{ y: 120, opacity: 0, rotate: (index - 1) * 6 }}
      animate={{ y: 0, opacity: 1, rotate: (index - 1) * 1.5 }}
      transition={{ type: 'spring', stiffness: 220, damping: 20, delay: 0.15 + index * 0.1 }}
    >
      <motion.button
        type="button"
        className={`mode ${mode.locked ? 'is-locked' : 'is-open'}`}
        animate={controls}
        whileHover={mode.locked ? { y: -4 } : { y: -14, scale: 1.03, rotate: 0 }}
        whileTap={mode.locked ? undefined : { scale: 0.97 }}
        onHoverStart={() => { setHover(true); if (!mode.locked) play('hover'); }}
        onHoverEnd={() => setHover(false)}
        onClick={click}
        aria-disabled={mode.locked || undefined}
        aria-label={mode.locked ? `${mode.name}: ${mode.lockText ?? 'coming soon'}` : `Play ${mode.name}`}
      >
        <span className="mode__tab">Case {mode.no}</span>
        <div className="mode__art">
          {mode.icon && <motion.div className="mode__icon" animate={hover && !mode.locked ? { rotate: [0, -8, 8, 0], scale: 1.1 } : { rotate: 0, scale: 1 }} transition={{ duration: 0.5 }}>
            <Icon name={mode.icon} size={96} />
          </motion.div>}
          {mode.art}
          {mode.locked && (
            <div className="mode__lock"><Icon name="lock" size={40} /></div>
          )}
          {mode.solved && <div className="mode__solved">Solved</div>}
        </div>
        <div className="mode__body">
          <div className="mode__name tm-display">{mode.name}</div>
          <div className="mode__tag">{mode.tag}</div>
          <dl className="mode__stats">{mode.stats.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
          <div className="mode__cta">{mode.locked ? 'Sealed' : mode.cta ?? 'Open file'}</div>
        </div>
        {mode.locked && <div className={`mode__stamp ${mode.lockText ? 'mode__stamp--small' : ''}`}>{mode.lockText ?? 'Coming soon'}</div>}
      </motion.button>
    </motion.div>
  );
}

export default function ModeSelectScreen({ onPlay, onBack }) {
  return (
    <div className="modes">
      <div className="modes__desk" aria-hidden />
      <div className="modes__inner">
        <motion.div className="modes__head" initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 22 }}>
          <button type="button" className="modes__back" onClick={() => { play('click'); onBack(); }} aria-label="Back to title"><Icon name="arrow" size={22} style={{ transform: 'scaleX(-1)' }} /></button>
          <div>
            <div className="modes__kicker">Case archive</div>
            <h1 className="tm-display modes__title">Pick a case</h1>
          </div>
        </motion.div>
        <div className="modes__grid">
          {MODES.map((m, i) => <ModeCard key={m.id} mode={m} index={i} onPlay={onPlay} />)}
        </div>
      </div>
    </div>
  );
}

const DIFFICULTY = ['Easy', 'Medium', 'Hard', 'Brutal'];
/** cheaterIq is 0..1 in the engine; show it as 1-5 bars. */
const iqBars = (l, i) => {
  const q = l.cheaterIq;
  if (typeof q !== 'number') return Math.min(5, i + 1);
  return q <= 1 ? Math.max(1, Math.round(q * 5)) : Math.min(5, Math.round(q));
};

function IqMeter({ iq, max }) {
  return (
    <div className="level__iq">
      <span className="level__iqLabel">Cheater IQ</span>
      <span className="level__iqBars">
        {Array.from({ length: max }, (_, i) => <span key={i} className={i < iq ? 'is-on' : ''} />)}
      </span>
    </div>
  );
}

/** Step 2 after picking HOME: three levels, each unlocked by solving the one before. */
export function LevelSelect({ onPick, onBack }) {
  const cards = LEVELS.map((l, i) => {
    const locked = !isUnlocked(l.id);
    return {
      id: l.id,
      no: `0927-H · L${l.id}`,
      name: l.name,
      tag: l.tagline,
      icon: null,
      art: (
        <div className="level__art">
          <div className="level__num tm-display">Case {l.id}</div>
          {!locked && <div className={`level__diff level__diff--${i}`}>{DIFFICULTY[i] ?? `Level ${l.id}`}</div>}
          {!locked && <IqMeter iq={iqBars(l, i)} max={5} />}
        </div>
      ),
      stats: [['Rounds', '3'], ['Time', '~10 min']],
      locked,
      solved: isSolved(l.id),
      lockText: i > 0 ? `Solve case ${LEVELS[i - 1].id} to unlock` : undefined,
      cta: 'Open case',
    };
  });
  return (
    <div className="modes">
      <div className="modes__desk" aria-hidden />
      <div className="modes__inner">
        <motion.div className="modes__head" initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 22 }}>
          <button type="button" className="modes__back" onClick={() => { play('click'); onBack(); }} aria-label="Back to case archive"><Icon name="arrow" size={22} style={{ transform: 'scaleX(-1)' }} /></button>
          <div>
            <div className="modes__kicker">Case 0927-H · Home</div>
            <h1 className="tm-display modes__title">Pick a level</h1>
          </div>
        </motion.div>
        <div className="modes__grid modes__grid--levels" style={{ '--n': cards.length }}>
          {cards.map((m, i) => <ModeCard key={m.id} mode={m} index={i} onPlay={() => onPick(m.id)} />)}
        </div>
      </div>
    </div>
  );
}
