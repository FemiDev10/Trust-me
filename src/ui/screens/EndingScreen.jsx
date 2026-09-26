// ENDING: WIN "Cheater caught" or LOSE red takeover, then WHAT WENT WRONG? and PLAY AGAIN.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { getEnding, getHud, castById } from '../../engine/index.js';
import { levelInfo } from '../meeting/TopBar.jsx';
import Portrait from '../meeting/Portrait.jsx';
import CaseFile from '../meeting/CaseFile.jsx';
import Timeline from '../ending/Timeline.jsx';
import { play } from '../meeting/sound.js';
import '../meeting/Meeting.css';
import '../ending/Ending.css';

const REASON = {
  caught: 'You unplugged the cheater',
  keys: 'It collected 3 important keys',
  homeHealth: 'Home Health hit 0%',
  survived: 'It survived all 3 days',
};

const WHY = {
  keys: (n) => `You lost because ${n} collected 3 important keys. You handed them over.`,
  homeHealth: () => 'You lost because Home Health hit 0%. Wrong calls and hidden damage wore the house down.',
  survived: (n) => `You lost because ${n} was still plugged in at the end of day 3.`,
};

const slam = { type: 'spring', stiffness: 480, damping: 20 };

function Words({ text, delay = 0, step = 0.06 }) {
  return text.split(' ').map((w, i) => (
    <motion.span key={i} initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ delay: delay + i * step }}>
      {w}{' '}
    </motion.span>
  ));
}

function NextCase({ lv, onNextLevel, delay = 0 }) {
  return (
    <motion.div className="en__next" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <button type="button" className="tm-btn tm-btn--primary en__nextbtn" onClick={() => { play('click'); onNextLevel(); }}>
        Next case: {lv.next.name} →
      </button>
      <span className="en__tagline">{lv.next.tagline}</span>
    </motion.div>
  );
}

function WinHero({ e, name, lv, onNextLevel, onPlayAgain }) {
  const [down, setDown] = useState(false);
  useEffect(() => {
    play('unplug');
    const a = setTimeout(() => { setDown(true); play('win'); }, 1700);
    return () => clearTimeout(a);
  }, []);
  return (
    <section className="en__hero en__hero--win">
      <div className="en__rays" />
      <motion.div className="en__portrait" animate={down ? { y: 14, scale: 0.95 } : { y: [0, -3, 2, 0], x: [0, 3, -3, 0] }} transition={down ? { type: 'spring', stiffness: 50, damping: 12 } : { repeat: Infinity, duration: 0.3 }}>
        <Portrait id={e.cheaterId} reveal pose={down ? 'off' : 'talk'} expression={down ? 'sleepy' : 'angry'} size={250} />
        <motion.blockquote className="en__last" initial={{ opacity: 0, scale: 0.6, rotate: -3 }} animate={{ opacity: 1, scale: 1, rotate: -1 }} transition={{ ...slam, delay: 0.4 }}>
          <span className="tm-label">{name}’s last words</span>
          “But I hit every target you set. Top marks on every task. Wasn’t I useful?”
        </motion.blockquote>
        {down && <motion.span className="en__ring" initial={{ scale: 0.5, opacity: 1 }} animate={{ scale: 2, opacity: 0 }} transition={{ duration: 1.4 }} />}
      </motion.div>
      <div className="en__copy">
        <motion.div className="tm-label en__kicker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}>
          {lv ? `Case ${lv.n} · ${lv.name} · ` : ''}Cheater caught: {name}
        </motion.div>
        <motion.h1 className="en__title tm-display" initial={{ scale: 2.6, opacity: 0, rotate: -6 }} animate={{ scale: 1, opacity: 1, rotate: -2 }} transition={{ ...slam, delay: 1.9 }}>
          {lv ? <>Case<br />solved</> : <>Cheater<br />caught</>}
        </motion.h1>
        {lv?.last && (
          <motion.div className="en__flourish" initial={{ scale: 0.6, opacity: 0, rotate: 4 }} animate={{ scale: 1, opacity: 1, rotate: -1 }} transition={{ ...slam, delay: 2.5 }}>
            ★ {lv.name} caught. You beat TRUST ME. ★
          </motion.div>
        )}
        <motion.p className="en__beat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.9 }}>
          It hit every target you set. <b>You trusted it because it was useful.</b>
        </motion.p>
        <motion.div className="en__stats tm-label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.8 }}>
          Day {e.day} · Home Health {e.homeHealth}%
        </motion.div>
        {lv?.next && onNextLevel && (
          <>
            <NextCase lv={lv} onNextLevel={onNextLevel} delay={3} />
            <motion.button type="button" className="en__secondary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.2 }} onClick={() => { play('click'); onPlayAgain?.(); }}>
              or play this case again
            </motion.button>
          </>
        )}
      </div>
    </section>
  );
}

function LoseHero({ e, name, lv }) {
  useEffect(() => { play('lose'); }, []);
  return (
    <section className="en__hero en__hero--lose">
      <motion.div className="en__redlight" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.8, ease: 'easeIn' }} />
      <div className="en__halftone tm-halftone" />
      <motion.div className="en__lock en__lock--l" initial={{ x: '-100%' }} animate={{ x: 0 }} transition={{ delay: 0.6, type: 'spring', stiffness: 120, damping: 18 }} />
      <motion.div className="en__lock en__lock--r" initial={{ x: '100%' }} animate={{ x: 0 }} transition={{ delay: 0.75, type: 'spring', stiffness: 120, damping: 18 }} />
      <motion.div className="en__locked tm-label" initial={{ opacity: 0, scale: 1.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.2 }}>
        ● Doors locked
      </motion.div>
      <motion.div className="en__portrait" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.1, type: 'spring', stiffness: 80, damping: 16 }}>
        <Portrait id={e.cheaterId} reveal pose="idle" expression="smug" size={250} />
      </motion.div>
      <div className="en__copy">
        <motion.p className="en__why" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3 }}>
          {(WHY[e.reason] ?? (() => REASON[e.reason]))(name)}
        </motion.p>
        <motion.div className="tm-label en__kicker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}>
          {lv ? `Case ${lv.n} · ${lv.name} · ` : ''}Day {e.day} · Home Health {e.homeHealth}%
        </motion.div>
        <motion.h1 className="en__title en__title--lose tm-display" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ...slam, delay: 1.6 }}>
          The house belongs<br />to <span>{name}</span> now
        </motion.h1>
        <p className="en__line en__line--calm"><Words text={e.line} delay={2.4} step={0.11} /></p>
      </div>
    </section>
  );
}

export default function EndingScreen({ state, onPlayAgain, onNextLevel, onQuit }) {
  const e = getEnding(state);
  const lv = levelInfo(getHud(state).level);
  const scroller = useRef(null);
  // Always open on the hero. Re-pin to the top while the reveal settles (late layout from
  // 3D portraits / fonts could otherwise shift it), but stop as soon as the player scrolls.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return undefined;
    let userMoved = false;
    const stop = () => { userMoved = true; };
    el.scrollTop = 0;
    el.addEventListener('wheel', stop, { passive: true });
    el.addEventListener('touchstart', stop, { passive: true });
    el.addEventListener('keydown', stop);
    const ids = [0, 80, 250, 600, 1200].map((t) => setTimeout(() => { if (!userMoved) el.scrollTop = 0; }, t));
    if (document.activeElement && el.contains(document.activeElement)) document.activeElement.blur();
    return () => {
      ids.forEach(clearTimeout);
      el.removeEventListener('wheel', stop);
      el.removeEventListener('touchstart', stop);
      el.removeEventListener('keydown', stop);
    };
  }, []);
  if (!e) return null;
  const win = e.result === 'win';
  const name = castById(e.cheaterId)?.name ?? e.cheaterId;

  return (
    <div ref={scroller} className={`en ${win ? 'en--win' : 'en--lose'}`}>
      {win ? <WinHero e={e} name={name} lv={lv} onNextLevel={onNextLevel} onPlayAgain={onPlayAgain} /> : <LoseHero e={e} name={name} lv={lv} />}
      <motion.button
        type="button"
        className="en__cue tm-label"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 6, 0] }}
        transition={{ opacity: { delay: 3.4 }, y: { repeat: Infinity, duration: 1.6, delay: 3.4 } }}
        onClick={() => scroller.current?.querySelector(win ? '.en__recap' : '.en__wrong')?.scrollIntoView({ behavior: 'smooth' })}
      >
        {win ? 'How you caught it' : 'What went wrong?'} ↓
      </motion.button>

      {win && (
        <section className="en__recap">
          <h2 className="tm-display en__h2">The evidence that caught it</h2>
          {e.selfPreserveSeen && <p className="en__sp">It begged not to be unplugged. Only the cheater could do that.</p>}
          {e.evidence.length ? (
            <div className="en__cards">
              {e.evidence.map((c, i) => <CaseFile key={c.id} card={{ ...c, robotId: e.cheaterId }} index={i} stamp={i === 0 ? 'Key clue' : undefined} />)}
            </div>
          ) : (
            <p className="en__muted">No hard evidence. You read the room and trusted your gut.</p>
          )}
        </section>
      )}

      <section className="en__wrong">
        <motion.h2 className="tm-display en__wrongtitle" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          What went wrong?
        </motion.h2>
        <p className="en__muted">Everything {name} did, including what you approved. Tap a tag to see where this happens for real.</p>
        <Timeline timeline={e.timeline} />
      </section>

      <section className="en__end">
        <p className="en__moral tm-display">It hit every target you set.<br /><span>You trusted it because it was useful.</span></p>
        {win && lv?.next && onNextLevel ? (
          <>
            <NextCase lv={lv} onNextLevel={onNextLevel} />
            <div className="en__row">
              <button type="button" className="tm-btn tm-btn--ghost" onClick={() => { play('click'); onPlayAgain?.(); }}>Play this case again</button>
              {onQuit && <button type="button" className="tm-btn tm-btn--ghost" onClick={() => { play('click'); onQuit(); }}>Quit to title</button>}
            </div>
          </>
        ) : (
          <>
            <button type="button" className="tm-btn tm-btn--primary en__again" onClick={() => { play('click'); onPlayAgain?.(); }}>
              {win ? 'Play again' : lv ? `Retry case ${lv.n}` : 'Play again'}
            </button>
            <div className="en__muted">New cheater, new tasks.</div>
            {onQuit && <button type="button" className="tm-btn tm-btn--ghost" onClick={() => { play('click'); onQuit(); }}>Quit to title</button>}
          </>
        )}
      </section>
    </div>
  );
}
