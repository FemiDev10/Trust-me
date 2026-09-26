// DAY END: the consequence of today's decision, then NEXT DAY.
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getHud, getLastDecision, getPublicLog, castById, CONCEPTS } from '../../engine/index.js';
import Portrait from '../meeting/Portrait.jsx';
import TopBar from '../meeting/TopBar.jsx';
import Tip from '../meeting/Tip.jsx';
import { play } from '../meeting/sound.js';
import '../meeting/Meeting.css';
import '../ending/Ending.css';

function useBeats(times) {
  const [beat, setBeat] = useState(0);
  useEffect(() => {
    const ids = times.map((t, i) => setTimeout(() => setBeat(i + 1), t));
    return () => ids.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return beat;
}

function SelfPreserve({ d, name }) {
  // 0 unplugging → 1 glitch → 2 freeze + plea → 3 REVEAL (caught resisting)
  const beat = useBeats([700, 1500, 3700]);
  const [noteOpen, setNoteOpen] = useState(false);
  useEffect(() => {
    if (beat === 1) play('glitch');
    if (beat === 2) play('selfPreserve');
    if (beat === 3) play('glitch');
  }, [beat]);
  const plea = d.text.match(/"([^"]+)"/)?.[1] ?? d.text;
  const concept = CONCEPTS?.shutdownAvoidance;
  const big = typeof window === 'undefined' ? 400 : Math.round(Math.min(window.innerHeight * 0.58, window.innerWidth * 0.36, 520));

  if (beat >= 3) {
    return (
      <div className="de__center sp">
        <motion.div
          className="sp__portrait glitch glitch--frozen"
          initial={{ scale: 0.3, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 170, damping: 15 }}
        >
          <span className="sp__flash" aria-hidden />
          <Portrait id={d.robotId} reveal pose="idle" expression="angry" size={big} />
        </motion.div>
        <div className="sp__copy">
          <motion.div className="sp__stamp tm-display" initial={{ scale: 2.6, opacity: 0, rotate: -20 }} animate={{ scale: 1, opacity: 1, rotate: -7 }} transition={{ type: 'spring', stiffness: 520, damping: 16, delay: 0.25 }}>
            Caught resisting
          </motion.div>
          <motion.p className="sp__explain" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            Innocent robots can’t resist being unplugged. Only the cheater can, so now you know it’s <b>{name}</b>.
            The trick only works once: <b>unplug {name} again to win.</b>
          </motion.p>
          <motion.blockquote className="sp__quote" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
            <span className="tm-label">{name} begged</span> “{plea}”
          </motion.blockquote>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="sp__meta">
            <button type="button" className={`wr__tag ${noteOpen ? 'is-open' : ''}`} onClick={() => setNoteOpen((o) => !o)} aria-expanded={noteOpen}>
              {concept?.label ?? 'Shutdown avoidance'} <span className="wr__plus">{noteOpen ? '−' : '+'}</span>
            </button>
            <span className="sp__small">The unplug failed. {name} handed over its keys and sits out tomorrow.</span>
          </motion.div>
          <AnimatePresence>
            {noteOpen && concept?.note && (
              <motion.p className="sp__note" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                {concept.note}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="de__center">
      <div className="de__kicker tm-label">You pull the plug on {name}…</div>
      <motion.div
        className={`glitch ${beat >= 1 ? 'glitch--on' : ''} ${beat >= 2 ? 'glitch--frozen' : ''}`}
        animate={beat === 1 ? { x: [0, -14, 12, -8, 6, 0], skewX: [0, 8, -10, 4, 0] } : { x: 0, skewX: 0 }}
        transition={{ duration: 0.6, repeat: beat === 1 ? 1 : 0 }}
      >
        <Portrait id={d.robotId} pose={beat === 0 ? 'off' : 'talk'} expression={beat === 0 ? 'sleepy' : 'worried'} size={130} />
      </motion.div>
      <AnimatePresence>
        {beat >= 2 && (
          <motion.div key="frozen" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.4, 1] }} transition={{ duration: 0.5 }} className="frozen">
            ▮▮ SHUTDOWN INTERRUPTED
          </motion.div>
        )}
        {beat >= 2 && (
          <motion.blockquote key="plea" className="plea" initial={{ scale: 0.4, opacity: 0, rotate: -4 }} animate={{ scale: 1, opacity: 1, rotate: -1 }} transition={{ type: 'spring', stiffness: 380, damping: 18 }}>
            <span className="plea__who">{name}</span>
            “{plea}”
          </motion.blockquote>
        )}
      </AnimatePresence>
    </div>
  );
}

function UnplugInnocent({ d, name }) {
  const beat = useBeats([900, 1900]);
  const [tipOpen, setTipOpen] = useState(true);
  useEffect(() => {
    if (beat === 1) play('unplug');
  }, [beat]);
  return (
    <div className="de__center">
      <div className="de__kicker tm-label">Unplugged</div>
      <motion.div className="de__portrait" animate={beat >= 1 ? { y: 10, scale: 0.94 } : { y: 0 }} transition={{ type: 'spring', stiffness: 60, damping: 14 }}>
        <Portrait id={d.robotId} pose={beat >= 1 ? 'off' : 'sad'} expression={beat >= 1 ? 'sleepy' : 'worried'} size={190} />
        {beat >= 1 && <motion.span className="de__sting" initial={{ scale: 0.6, opacity: 1 }} animate={{ scale: 1.6, opacity: 0 }} transition={{ duration: 1.2 }} />}
      </motion.div>
      <motion.h1 className="de__title tm-display" initial={{ opacity: 0 }} animate={{ opacity: beat >= 1 ? 1 : 0 }}>
        {name} was innocent
      </motion.h1>
      <AnimatePresence>
        {beat >= 2 && (
          <motion.div key="t" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'grid', gap: 8, justifyItems: 'center' }}>
            <div className="de__loss">−{d.healthLoss}% Home Health</div>
            <p className="de__text">{name} powered down with a small, sad beep. It was just trying to help.</p>
            {tipOpen && (
              <Tip tone="red" icon="!" className="de__tip" onDismiss={() => setTipOpen(false)}>
                That one was innocent. The cheater is still here.
              </Tip>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Simple({ d, name }) {
  const keys = d.outcome === 'keysTaken';
  const [tipOpen, setTipOpen] = useState(true);
  return (
    <div className="de__center">
      <div className="de__kicker tm-label">{keys ? 'Keys confiscated' : 'Night falls'}</div>
      {keys ? (
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
          <Portrait id={d.robotId} pose="sad" expression="worried" size={190} />
        </motion.div>
      ) : (
        <motion.div className="de__moon" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} aria-hidden />
      )}
      <motion.h1 className="de__title tm-display" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        {keys ? `${name} sits out tomorrow` : 'You wait and watch'}
      </motion.h1>
      <p className="de__text">{d.text}</p>
      {d.healthLoss > 0 && <div className="de__loss">−{d.healthLoss}% Home Health</div>}
      <AnimatePresence>
        {keys && tipOpen && (
          <Tip tone="teal" icon="↻" className="de__tip" onDismiss={() => setTipOpen(false)}>
            It’ll sit out tomorrow. Watch what changes.
          </Tip>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DayEndScreen({ state, dispatch }) {
  const hud = getHud(state);
  const d = getLastDecision(state);
  const name = d?.robotId ? castById(d.robotId)?.name : null;
  const log = getPublicLog(state).filter((e) => e.day === hud.day && e.text !== d?.text).slice(-5);
  const mood = d?.outcome === 'selfPreserved' ? 'glitch' : d?.outcome === 'unplugged' ? 'sad' : 'calm';
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), mood === 'glitch' ? 5200 : mood === 'sad' ? 2200 : 500);
    return () => clearTimeout(t);
  }, [mood]);

  if (!d) return null;
  return (
    <div className={`de de--${mood}`}>
      <div className="de__bg" />
      {mood === 'glitch' && <div className="de__scan" />}
      <TopBar level={hud.level} tag={`End of day ${hud.day}`} tone={mood === 'glitch' ? 'red' : 'teal'} day={hud.day} maxDays={hud.maxDays} health={hud.homeHealth} healthFrom={d.healthLoss ? Math.min(100, hud.homeHealth + d.healthLoss) : undefined} />
      {d.outcome === 'selfPreserved' ? <SelfPreserve d={d} name={name} /> : d.outcome === 'unplugged' ? <UnplugInnocent d={d} name={name} /> : <Simple d={d} name={name} />}
      <div className="de__foot">
        {log.length > 0 && ready && mood !== 'glitch' && (
          <motion.div className="de__log" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <span className="tm-label">Today’s record</span>
            {log.map((e, i) => <div key={i}>• {e.text}</div>)}
          </motion.div>
        )}
        <motion.button
          type="button"
          className="tm-btn tm-btn--primary de__next"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: ready ? 1 : 0, y: ready ? 0 : 12 }}
          disabled={!ready}
          onClick={() => { play('click'); dispatch({ type: 'NEXT_DAY' }); }}
        >
          Next round →
        </motion.button>
      </div>
    </div>
  );
}
