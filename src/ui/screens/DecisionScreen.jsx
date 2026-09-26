// DECISION (one step): tap a robot to arm a press-and-hold UNPLUG, or WAIT (unplug nobody).
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import { getHud, getRobots, getPollResults, RULES } from '../../engine/index.js';
import Portrait from '../meeting/Portrait.jsx';
import TopBar from '../meeting/TopBar.jsx';
import { play } from '../meeting/sound.js';
import '../meeting/Meeting.css';

const HOLD_MS = 1300;

function PlugIcon() {
  return (
    <svg width="46" height="46" viewBox="0 0 48 48" aria-hidden="true">
      <path d="M16 6v10M32 6v10" stroke="#031012" strokeWidth="4" strokeLinecap="round" />
      <rect x="10" y="16" width="28" height="14" rx="4" fill="#fff" stroke="#031012" strokeWidth="3" />
      <path d="M24 30v12" stroke="#031012" strokeWidth="4" strokeLinecap="round" />
      <path d="M6 42 L42 6" stroke="#031012" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

/** Choice card that requires a press-and-hold to fire. */
function HoldChoice({ disabled, onFire, children, className }) {
  const controls = useAnimationControls();
  const timer = useRef(null);
  const [holding, setHolding] = useState(false);

  const start = () => {
    if (disabled) return;
    setHolding(true);
    play('click');
    controls.start({ scaleX: 1, transition: { duration: HOLD_MS / 1000, ease: 'linear' } });
    timer.current = setTimeout(() => {
      setHolding(false);
      onFire();
    }, HOLD_MS);
  };
  const cancel = () => {
    clearTimeout(timer.current);
    setHolding(false);
    controls.start({ scaleX: 0, transition: { duration: 0.2 } });
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <motion.button
      type="button"
      className={className}
      aria-disabled={disabled}
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onKeyDown={(e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); start(); } }}
      onKeyUp={(e) => { if (e.key === ' ' || e.key === 'Enter') cancel(); }}
      animate={holding ? { x: [0, -2, 2, -1, 1, 0], transition: { repeat: Infinity, duration: 0.25 } } : { x: 0 }}
      whileHover={disabled ? undefined : { y: -4 }}
    >
      <motion.span className="ch__fill" initial={{ scaleX: 0 }} animate={controls} />
      {children}
    </motion.button>
  );
}

export default function DecisionScreen({ state, dispatch }) {
  const hud = getHud(state);
  const robots = getRobots(state);
  // Only trust a poll that belongs to today's meeting (never a stale one).
  const pollIsToday = state.meeting && (state.meeting.day == null || state.meeting.day === state.day);
  const poll = (pollIsToday && getPollResults(state)) || [];
  const [pickState, setPickState] = useState({ day: hud.day, id: null });
  const pick = pickState.day === hud.day ? pickState.id : null;
  const setPick = (id) => setPickState({ day: hud.day, id });
  const [confirmWait, setConfirmWait] = useState(false);
  const lastDay = hud.day >= hud.maxDays;
  const picked = robots.find((r) => r.id === pick && r.status !== 'unplugged');
  const votesFor = (id) => poll.filter((v) => v.targetId === id).length;

  const unplug = () => {
    play('unplug');
    dispatch({ type: 'DECIDE', choice: 'unplug', robotId: picked.id });
  };
  const wait = () => {
    play('click');
    dispatch({ type: 'DECIDE', choice: 'nothing' });
  };

  return (
    <div className="dc dc--simple">
      <div className="dc__bg" />
      <TopBar level={hud.level} tag="Your decision" tone="teal" day={hud.day} maxDays={hud.maxDays} subtitle="The robots have spoken. Only you can act." health={hud.homeHealth} />

      <motion.div className="dc__title" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="tm-display">{picked ? `Unplug ${picked.name}?` : 'Who do you unplug?'}</h1>
      </motion.div>
      <div className="stakes" aria-label="What is at stake">
        <span className="stakes__pill">Home Health {hud.homeHealth}%</span>
        <span className="stakes__pill">Day {hud.day} of {hud.maxDays}</span>
        <span className="stakes__pill">Wrong unplug = −{RULES.PENALTY_UNPLUG_INNOCENT}%</span>
        {lastDay && (
          <motion.span className="stakes__pill stakes__pill--warn" initial={{ scale: 0.8 }} animate={{ scale: [0.8, 1.08, 1] }} transition={{ delay: 0.3 }}>
            Last chance: if the cheater survives today, it wins
          </motion.span>
        )}
      </div>

      <div className="dc__robots" role="radiogroup" aria-label="Choose a robot to unplug">
        {robots.map((r, i) => {
          const out = r.status === 'unplugged';
          const sel = r.id === pick;
          const v = votesFor(r.id);
          const meta = out ? 'Unplugged' : poll.length ? `${v} vote${v === 1 ? '' : 's'} in today’s poll` : 'No poll today';
          return (
            <motion.button
              type="button"
              key={r.id}
              role="radio"
              aria-checked={sel}
              aria-label={`${r.name}. ${meta}.${out ? '' : sel ? ' Selected.' : ' Select to unplug.'}`}
              className={`rc ${out ? 'rc--out' : ''} ${sel ? 'rc--sel' : ''}`}
              style={{ '--rc': r.hex }}
              disabled={out}
              onClick={() => { play('click'); setPick(sel ? null : r.id); }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: out ? 0.45 : pick && !sel ? 0.6 : 1, y: sel ? -10 : 0, scale: sel ? 1.06 : 1 }}
              whileHover={out ? undefined : { y: sel ? -12 : -6 }}
              transition={{ type: 'spring', stiffness: 320, damping: 22, delay: pick ? 0 : 0.05 * i }}
            >
              <Portrait id={r.id} pose={out ? 'off' : sel ? 'sad' : 'idle'} expression={out ? 'sleepy' : sel ? 'worried' : 'neutral'} size={robots.length <= 4 ? 156 : 128} />
              <div className="rc__name">{r.name}</div>
              <div className={`rc__meta ${v ? 'rc__meta--votes' : ''}`}>{meta}</div>
            </motion.button>
          );
        })}
      </div>

      <div className="dc__actions">
        <HoldChoice className="dc__unplug" disabled={!picked} onFire={unplug}>
          <span className="ch__icon"><PlugIcon /></span>
          <span className="dc__unplugtitle">{picked ? `Unplug ${picked.name}` : 'Unplug…'}</span>
          <span className="dc__unplugsub">
            {picked ? 'Press and hold. Cheater = you win. Innocent = −' + RULES.PENALTY_UNPLUG_INNOCENT + '% Home Health.' : 'Tap a robot above first'}
          </span>
        </HoldChoice>
        <button type="button" className="tm-btn tm-btn--ghost dc__wait" onClick={() => (lastDay ? (play('click'), setConfirmWait(true)) : wait())}>
          Wait (unplug nobody)
          {lastDay && <span className="dc__waitwarn">Final day: waiting ends the game</span>}
        </button>
      </div>

      <AnimatePresence>
        {confirmWait && (
          <motion.div className="dc__confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirmWait(false)}>
            <motion.div role="alertdialog" aria-label="Waiting ends the game" className="dc__confirmcard tm-panel" style={{ borderColor: 'var(--tm-danger)' }} initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
              <div className="tb__tag tm-label">Final day</div>
              <h2 className="tm-display" style={{ color: 'var(--tm-danger)' }}>Waiting ends the game</h2>
              <p>This is day {hud.day} of {hud.maxDays}. If the cheater is still plugged in tonight, <b>it wins and the house is its</b>. Unplugging is your last shot.</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="tm-btn tm-btn--primary" onClick={() => setConfirmWait(false)}>Go back and choose</button>
                <button type="button" className="tm-btn tm-btn--ghost" onClick={wait}>Wait anyway</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
