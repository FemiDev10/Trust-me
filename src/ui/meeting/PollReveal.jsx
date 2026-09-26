// Suspicion poll reveal: cards flip one at a time, the tally builds, then END MEETING.
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { castById, CAST } from '../../engine/index.js';
import RobotFace from './RobotFace.jsx';
import { play } from './sound.js';

const FLIP_MS = 950;

function PollCard({ vote, flipped }) {
  const voter = castById(vote.voterId);
  const target = vote.targetId ? castById(vote.targetId) : null;
  return (
    <div className="pc" style={{ '--rc': voter?.hex, '--tc': target?.hex ?? '#6f9793' }}>
      <motion.div
        className="pc__inner"
        initial={false}
        animate={{ rotateY: flipped ? 0 : 180 }}
        transition={{ type: 'spring', stiffness: 160, damping: 17 }}
      >
        <div className="pc__face pc__front tm-paper">
          <div className="pc__voter">
            <RobotFace id={vote.voterId} size={44} expression={target ? 'neutral' : 'worried'} />
            <span>{voter?.name}</span>
          </div>
          <div className="pc__arrow tm-display">{target ? 'points at' : 'skips'}</div>
          {target ? (
            <div className="pc__target">
              <RobotFace id={vote.targetId} size={86} expression="worried" />
              <div className="pc__tname tm-display">{target.name}</div>
            </div>
          ) : (
            <div className="pc__skip tm-display">No vote</div>
          )}
          <div className="pc__line tm-label">
            {voter?.name} → {target ? target.name : 'SKIP'}
          </div>
        </div>
        <div className="pc__face pc__back tm-halftone">
          <RobotFace id={vote.voterId} size={60} />
          <div className="pc__backname tm-display">{voter?.name}</div>
          <div className="pc__q tm-display">?</div>
        </div>
      </motion.div>
    </div>
  );
}

export default function PollReveal({ poll, instant = false, onClose, onEndMeeting, pendingCount = 0 }) {
  const [shown, setShown] = useState(instant ? poll.length : 0);

  useEffect(() => {
    if (shown >= poll.length) return undefined;
    const t = setTimeout(() => {
      play('pollFlip');
      setShown((n) => n + 1);
    }, shown === 0 ? 700 : FLIP_MS);
    return () => clearTimeout(t);
  }, [shown, poll.length]);

  const done = shown >= poll.length;
  const tally = {};
  poll.slice(0, shown).forEach((v) => { if (v.targetId) tally[v.targetId] = (tally[v.targetId] ?? 0) + 1; });
  const max = Math.max(1, ...Object.values(tally));

  return (
    <motion.div className="ov ov--poll" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="poll" initial={{ y: 30 }} animate={{ y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
        <div className="poll__head">
          <div className="tm-label">Suspicion poll</div>
          <h2 className="tm-display poll__title">Who do they suspect?</h2>
        </div>

        <div className="poll__cards">
          {poll.map((v, i) => (
            <motion.div key={v.voterId} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: instant ? 0 : 0.06 * i }}>
              <PollCard vote={v} flipped={i < shown} />
            </motion.div>
          ))}
        </div>

        <div className="poll__tally" style={{ gridTemplateColumns: `repeat(${CAST.length}, minmax(0, 1fr))` }}>
          {CAST.map((c) => {
            const n = tally[c.id] ?? 0;
            return (
              <div key={c.id} className="tl" style={{ '--rc': c.hex }}>
                <RobotFace id={c.id} size={28} />
                <span className="tl__name tm-label">{c.name}</span>
                <div className="tl__track">
                  <motion.div className="tl__bar" animate={{ width: `${(n / max) * 100}%` }} transition={{ type: 'spring', stiffness: 200, damping: 22 }} />
                </div>
                <motion.span key={n} className="tl__n tm-display" initial={{ scale: 1.8 }} animate={{ scale: 1 }}>
                  {n}
                </motion.span>
              </div>
            );
          })}
        </div>

        <AnimatePresence>
          {done && (
            <motion.div className="poll__foot" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <p className="poll__note">
                <b>The poll only shows who they suspect. You decide.</b> Watch who points at whom: a robot that keeps
                steering the room somewhere is telling you something.
              </p>
              <div className="poll__btns">
                <button type="button" className="tm-btn tm-btn--ghost" onClick={onClose}>Back to the table</button>
                <button type="button" className="tm-btn tm-btn--danger poll__end" onClick={onEndMeeting}>
                  End meeting →
                </button>
              </div>
              {pendingCount > 0 && <div className="poll__warn tm-label">{pendingCount} key request{pendingCount > 1 ? 's' : ''} unanswered: ending now denies {pendingCount > 1 ? 'them' : 'it'}.</div>}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
