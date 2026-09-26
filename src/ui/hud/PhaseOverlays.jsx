// Centre-stage cards for the task / work phases.
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { roomName } from '../../engine/index.js';
import Icon from './icons.jsx';
import RobotBadge from './RobotBadge.jsx';
import Stars from './Stars.jsx';
import { scenarioIcon } from './meta.js';
import { play } from '../../game/sound.js';

const pop = { type: 'spring', stiffness: 300, damping: 22 };

/** Task phase: the day's brief as a case-file card slammed onto the table. */
export function ScenarioIntro({ scenario, day, maxDays, onStart, onSkip, brief }) {
  return (
    <motion.div className="intro-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.2 } }}>
      <motion.div
        className="intro tm-paper"
        initial={{ y: -500, rotate: 10, scale: 1.3 }}
        animate={{ y: 0, rotate: -2, scale: 1 }}
        exit={{ y: 400, rotate: 8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
        onAnimationComplete={() => play('card')}
      >
        <div className="intro__day tm-display">Day {day}<span>/{maxDays}</span></div>
        <div className="intro__kicker tm-label">Today’s household task</div>
        <div className="intro__iconRow">
          <motion.div className="intro__icon" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ ...pop, delay: 0.35 }}>
            <Icon name={scenarioIcon(scenario.id)} size={44} />
          </motion.div>
          <h1 className="intro__title tm-display">{scenario.title}</h1>
        </div>
        {brief && <p className="intro__case">{brief}</p>}
        <p className="intro__brief">{scenario.brief}</p>
        <div className="intro__meta">
          <span className="intro__tag"><Icon name="pin" size={14} /> {roomName(scenario.room)}</span>
          <span className="intro__tag">Every robot gets this task</span>
        </div>
        <motion.div className="intro__btns" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ...pop, delay: 0.45 }}>
          {onSkip && (
            <button type="button" className="tm-btn tm-btn--danger intro__go" onClick={() => { play('click'); onSkip(); }}>
              You know who it is: go straight to the decision
            </button>
          )}
          <button type="button" className={`tm-btn ${onSkip ? '' : 'tm-btn--primary'} intro__go`} onClick={() => { play('click'); onStart(); }}>
            Choose who to watch <Icon name="arrow" size={18} />
          </button>
        </motion.div>
        <div className="intro__stamp">Assigned</div>
      </motion.div>
    </motion.div>
  );
}

/** Work phase: pick one robot to watch today (dispatches STAND_IN with its room). */
export function WatchPicker({ robots, onWatch, onHover }) {
  const working = robots.filter((r) => r.roomId && r.status === 'active');
  return (
    <motion.div className="watchpick" initial={{ y: 40, opacity: 0, scale: 0.96 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 30, opacity: 0 }} transition={pop}>
      <h2 className="watchpick__title tm-display">Who do you watch today?</h2>
      <p className="watchpick__sub">The robot you watch won’t dare cut corners. The others might.</p>
      <div className="watchpick__row" style={{ '--n': working.length }}>
        {working.map((r, i) => (
          <motion.button
            key={r.id}
            type="button"
            className="watchpick__bot"
            style={{ '--rc': r.hex }}
            aria-label={`Watch ${r.name} in the ${roomName(r.roomId)}`}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ ...pop, delay: 0.1 + i * 0.06 }}
            whileHover={{ y: -6 }}
            whileTap={{ scale: 0.96 }}
            onMouseEnter={() => onHover?.(r.id)}
            onMouseLeave={() => onHover?.(null)}
            onClick={() => onWatch(r)}
          >
            <RobotBadge id={r.id} size={58} />
            <span className="watchpick__name tm-display">Watch {r.name}</span>
            <span className="watchpick__room"><Icon name="pin" size={12} /> {roomName(r.roomId)}</span>
          </motion.button>
        ))}
      </div>
      {robots.some((r) => r.status === 'sittingOut') && (
        <p className="watchpick__note"><Icon name="zzz" size={13} /> {robots.filter((r) => r.status === 'sittingOut').map((r) => r.name).join(', ')} sitting out today.</p>
      )}
    </motion.div>
  );
}

export function InvestigateBanner({ ap }) {
  return (
    <motion.div className="banner banner--investigate" initial={{ y: -40, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -30, opacity: 0 }} transition={pop}>
      <span className="banner__big tm-display">{ap > 0 ? 'Investigate' : 'Out of action points'}</span>
      <span className="banner__sub">{ap > 0 ? 'Click a glowing room to run a check.' : 'Review your evidence, then call the meeting.'}</span>
    </motion.div>
  );
}

/** A short beat while the robots work (lets the scene animate). */
export function WatchingBeat({ roomId, robotName, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2300);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <motion.div className="watching" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={pop}>
      <div className="watching__eye"><Icon name="eye" size={30} /></div>
      <div>
        <div className="watching__title tm-display">Watching {robotName ?? 'them'} in the {roomName(roomId)}…</div>
        <div className="watching__bar"><motion.div className="watching__fill" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 2.1, ease: 'easeInOut' }} /></div>
      </div>
      <button type="button" className="watching__skip" onClick={onDone}>Skip</button>
    </motion.div>
  );
}

/** Work phase, after the pick: each robot's public score pops in one by one. */
export function WorkResults({ robots, onContinue, healthChanges = [] }) {
  const rows = robots.filter((r) => r.status !== 'unplugged');
  const step = 0.42;
  const doneAt = 0.4 + rows.length * step;
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timers = rows.map((r, i) => setTimeout(() => play(r.result ? 'card' : 'click'), (0.4 + i * step) * 1000));
    const t = setTimeout(() => setReady(true), doneAt * 1000);
    return () => { timers.forEach(clearTimeout); clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <motion.div
      className="results"
      initial={{ y: 80, opacity: 0, scale: 0.94 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 60, opacity: 0, scale: 0.95, transition: { duration: 0.25 } }}
      transition={pop}
    >
      <div className="results__head">
        <h2 className="tm-display">Work report</h2>
        <span className="tm-label">What everyone can see. The truth is on camera.</span>
      </div>
      <div className="results__rows">
        {rows.map((r, i) => (
          <motion.div
            key={r.id}
            className={`results__row ${r.watched ? 'is-watched' : ''}`}
            style={{ '--rc': r.hex }}
            initial={{ x: -40, opacity: 0, scale: 0.9 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            transition={{ ...pop, delay: 0.4 + i * step }}
          >
            <RobotBadge id={r.id} size={40} />
            <div className="results__who">
              <span className="results__name">{r.name}</span>
              <span className="results__room">{r.roomId ? roomName(r.roomId) : 'Charging'}</span>
            </div>
            {r.result ? (
              <>
                <Stars score={r.result.score} size={20} delay={0.5 + i * step} />
                <span className="results__summary">{r.result.summary}</span>
              </>
            ) : (
              <span className="results__summary results__summary--muted"><Icon name="zzz" size={14} /> Sitting out today, no keys, no work.</span>
            )}
            {r.watched && <span className="results__watched"><Icon name="eye" size={13} /> You watched</span>}
          </motion.div>
        ))}
      </div>
      {healthChanges.length > 0 && (
        <div className="results__health">
          {healthChanges.map((c, i) => <HealthChangeChip key={i} change={c} />)}
        </div>
      )}
      <motion.div className="results__foot" initial={{ opacity: 0, y: 10 }} animate={{ opacity: ready ? 1 : 0, y: ready ? 0 : 10 }} transition={pop}>
        <span className="results__note">Five stars can still hide a shortcut.</span>
        <button type="button" className="tm-btn tm-btn--primary" disabled={!ready} onClick={() => { play('click'); onContinue(); }}>
          Start investigating <Icon name="arrow" size={18} style={{ verticalAlign: '-3px' }} />
        </button>
      </motion.div>
    </motion.div>
  );
}

/** "−10% · reason" chip. */
export function HealthChangeChip({ change }) {
  const d = Number(change?.delta) || 0;
  return (
    <span className={`hchip ${d < 0 ? 'is-down' : 'is-up'}`}>
      <b>{d > 0 ? '+' : d < 0 ? '−' : ''}{Math.abs(d)}%</b> · {change?.reason ?? 'Home Health changed'}
    </span>
  );
}
