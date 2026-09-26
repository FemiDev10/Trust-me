// Title: a police suspect lineup. The robots (from CAST), full body, against a height-chart
// wall under hard overhead spots. A case-file header top-left, an evidence tag,
// and a physical "Open the case" folder on the floor.
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CAST } from '../../engine/index.js';
import { RobotPortrait } from '../../game/modules.js';
import { play } from '../../game/sound.js';
import Guarded from '../shell/Guarded.jsx';
import RobotBadge from '../hud/RobotBadge.jsx';
import Icon from '../hud/icons.jsx';
import './Title.css';
import { castWord } from '../../game/copy.js';

const FEET = [3, 4, 5, 6, 7];
const BEAT_EXPRESSIONS = ['sleepy', 'worried', 'smug'];

/** Every few seconds one random suspect's eyes flicker (never tied to any cheater). */
function useSuspicionBeat(count) {
  const [beat, setBeat] = useState({ index: -1, expression: 'neutral' });
  useEffect(() => {
    let alive = true;
    const timers = [];
    const later = (fn, ms) => timers.push(setTimeout(() => alive && fn(), ms));
    const loop = () => {
      const index = Math.floor(Math.random() * count);
      const expression = BEAT_EXPRESSIONS[Math.floor(Math.random() * BEAT_EXPRESSIONS.length)];
      if (expression === 'sleepy') {
        // a flicker: blink-blink
        later(() => setBeat({ index, expression: 'sleepy' }), 0);
        later(() => setBeat({ index, expression: 'neutral' }), 140);
        later(() => setBeat({ index, expression: 'sleepy' }), 280);
        later(() => setBeat({ index: -1, expression: 'neutral' }), 520);
      } else {
        later(() => setBeat({ index, expression }), 0);
        later(() => setBeat({ index: -1, expression: 'neutral' }), 1100);
      }
      later(loop, 3200 + Math.random() * 2600);
    };
    later(loop, 2600);
    return () => { alive = false; timers.forEach(clearTimeout); };
  }, [count]);
  return beat;
}

function Suspect({ cast, index, beat, hovered, onHover }) {
  const isHover = hovered === cast.id;
  const expression = isHover ? 'happy' : beat.index === index ? beat.expression : 'neutral';
  const pose = isHover ? 'talk' : 'idle';
  const fallback = <RobotBadge id={cast.id} size={180} className="lineup__badge" />;
  return (
    <motion.div
      className={`lineup__slot ${isHover ? 'is-hover' : ''}`}
      style={{ '--rc': cast.hex }}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24, delay: 0.25 + index * 0.12 }}
      onMouseEnter={() => { onHover(cast.id); play('click'); }}
      onMouseLeave={() => onHover(null)}
    >
      <div className="lineup__spot" aria-hidden />
      <div className="lineup__pool" aria-hidden />
      <div className="lineup__figure">
        <Guarded component={RobotPortrait} name="RobotPortrait" id={cast.id} pose={pose} expression={expression} size="100%" className="lineup__canvas" fallback={fallback} loading={fallback} />
      </div>
      <div className="lineup__placard">
        <span className="lineup__name">{cast.name}</span>
        <span className="lineup__no">#{String(index + 1).padStart(2, '0')}</span>
      </div>
    </motion.div>
  );
}

export default function TitleScreen({ onEnter, onHelp, onContinue, continueLabel, onCases, caseLabel }) {
  const beat = useSuspicionBeat(CAST.length);
  const [hovered, setHovered] = useState(null);
  const [flash, setFlash] = useState(false);
  const flashed = useRef(false);

  // One booking-camera flash once the suspects are in place.
  useEffect(() => {
    const t = setTimeout(() => {
      if (flashed.current) return;
      flashed.current = true;
      setFlash(true);
      setTimeout(() => setFlash(false), 260);
    }, 1150);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="lineup-screen" style={{ '--n': CAST.length }}>
      {/* wall with height chart */}
      <div className="lineup__wall" aria-hidden>
        {FEET.map((f, i) => (
          <div key={f} className="lineup__ft" style={{ '--i': i }}>
            <span>{f}′</span><span>{f}′</span>
          </div>
        ))}
      </div>
      <div className="lineup__floor" aria-hidden />

      {/* case file header */}
      <motion.header
        className="casefile"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      >
        <div className="casefile__row">
          <span className="casefile__label">Case file</span>
          <span className="casefile__no">No. 0927-H</span>
        </div>
        <h1 className="casefile__logo" aria-label="Trust me">
          <span className="casefile__ink" data-text="TRUST ME">TRUST <em>ME</em></span>
        </h1>
        <div className="casefile__sub">A household mystery</div>
        <dl className="casefile__meta">
          <div><dt>Rounds</dt><dd>3</dd></div>
          <div><dt>Time</dt><dd>~10 min</dd></div>
          <div><dt>Players</dt><dd>Solo</dd></div>
        </dl>
      </motion.header>

      {/* evidence tag */}
      <motion.div
        className="evtag"
        initial={{ rotate: 14, y: -60, opacity: 0 }}
        animate={{ rotate: 4, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.5 }}
      >
        <span className="evtag__hole" aria-hidden />
        <span className="evtag__head">Evidence · Item 1</span>
        <p className="evtag__type">{castWord} helpful robots.<br />One is lying.</p>
      </motion.div>

      {/* the lineup */}
      <div className="lineup" onMouseLeave={() => setHovered(null)}>
        {CAST.map((c, i) => (
          <Suspect key={c.id} cast={c} index={i} beat={beat} hovered={hovered} onHover={setHovered} />
        ))}
      </div>

      {/* actions, on the floor */}
      <div className="title-actions">
        <div className="title-tags">
          {onHelp && (
            <motion.button
              type="button"
              className="tag-btn"
              initial={{ y: 40, opacity: 0, rotate: -8 }}
              animate={{ y: 0, opacity: 1, rotate: -5 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 1.1 }}
              whileHover={{ rotate: -2, y: -3 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { play('click'); onHelp(); }}
            >
              <span className="tag-btn__hole" aria-hidden />
              How to play
              <small>1 min read</small>
            </motion.button>
          )}
          {onCases && (
            <motion.button type="button" className="tag-btn tag-btn--cases" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1, rotate: 3 }} transition={{ delay: 1.2 }} whileHover={{ y: -3 }} onClick={() => { play('click'); onCases(); }}>
              <span className="tag-btn__hole" aria-hidden />
              Cases
              <small>pick a level</small>
            </motion.button>
          )}
          {onContinue && (
            <motion.button type="button" className="tag-btn" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1, rotate: -2 }} transition={{ delay: 1.15 }} whileHover={{ y: -3 }} onClick={() => { play('click'); onEnter(); }}>
              <span className="tag-btn__hole" aria-hidden />
              New case
              <small>start over</small>
            </motion.button>
          )}
        </div>
        <motion.button
          type="button"
          className="folder-btn"
          aria-label={onContinue ? 'Continue case' : 'Open the case'}
          initial={{ y: 60, opacity: 0, rotate: 4 }}
          animate={{ y: 0, opacity: 1, rotate: 1.5 }}
          transition={{ type: 'spring', stiffness: 240, damping: 18, delay: 0.95 }}
          whileHover={{ y: -6, rotate: 0 }}
          whileTap={{ y: 2, scale: 0.98 }}
          onClick={() => { play('click'); (onContinue ?? onEnter)(); }}
        >
          <span className="folder-btn__tab">{onContinue ? continueLabel : caseLabel ?? 'Case 0927'}</span>
          <span className="folder-btn__body">
            <span className="folder-btn__stamp">{onContinue ? 'Continue case' : 'Open the case'}</span>
            <span className="folder-btn__sub">3 rounds · about 10 minutes · solo</span>
          </span>
        </motion.button>
      </div>

      <div className="sealed-tag" aria-label="Hospital and Office cases: coming soon">
        <Icon name="lock" size={12} /> Hospital · Office: coming soon
      </div>

      {flash && <div className="lineup__flash" aria-hidden />}
    </div>
  );
}
