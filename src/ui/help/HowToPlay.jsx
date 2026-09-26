// HOW TO PLAY: paged, illustrated guide. One idea per card, a small visual each.
// Pure UI: opening/closing never touches game state.
import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CAST, RULES } from '../../engine/index.js';
import { RobotPortrait } from '../../game/modules.js';
import { play } from '../../game/sound.js';
import Guarded from '../shell/Guarded.jsx';
import RobotBadge from '../hud/RobotBadge.jsx';
import Icon from '../hud/icons.jsx';
import './HowToPlay.css';
import { castWord } from '../../game/copy.js';

const pop = { type: 'spring', stiffness: 420, damping: 22 };
const stagger = (i, base = 0.12) => ({ ...pop, delay: base + i * 0.07 });

/* ---------------- visuals ---------------- */

function VisPoint() {
  return (
    <div className="h2p-vis h2p-lineup">
      {CAST.map((c, i) => (
        <motion.div key={c.id} className="h2p-lineup__bot" style={{ '--rc': c.hex }} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={stagger(i)}>
          <Guarded component={RobotPortrait} id={c.id} pose="idle" expression="happy" size={84} fallback={<RobotBadge id={c.id} size={64} />} loading={<RobotBadge id={c.id} size={64} />} />
          <span className="h2p-lineup__name">{c.name}</span>
        </motion.div>
      ))}
      <motion.div className="h2p-stamp h2p-stamp--red h2p-lineup__stamp" initial={{ scale: 2.2, opacity: 0, rotate: -20 }} animate={{ scale: 1, opacity: 1, rotate: -9 }} transition={{ ...pop, delay: 0.6 }}>
        1 of these {CAST.length} is lying
      </motion.div>
    </div>
  );
}

const DAY_STEPS = [
  { icon: 'eye', label: 'Watch', sub: 'Pick 1 robot. It behaves.' },
  { icon: 'camera', label: '2 checks', sub: 'Camera or surprise test' },
  { icon: 'alarm', label: 'Meeting', sub: 'Hear them out' },
  { icon: 'plug', label: 'Decide', sub: 'Unplug or wait' },
];
function VisDay() {
  return (
    <div className="h2p-vis h2p-flow" style={{ '--n': DAY_STEPS.length }}>
      {DAY_STEPS.map((s, i) => (
        <motion.div key={s.label} className="h2p-flow__step" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={stagger(i)}>
          <span className="h2p-flow__num tm-display">{i + 1}</span>
          <span className="h2p-flow__icon"><Icon name={s.icon} size={28} /></span>
          <span className="h2p-flow__label">{s.label}</span>
          <span className="h2p-flow__sub">{s.sub}</span>
          {i < DAY_STEPS.length - 1 && <span className="h2p-flow__arrow"><Icon name="arrow" size={16} /></span>}
        </motion.div>
      ))}
      <div className="h2p-flow__repeat tm-label">× {RULES.MAX_DAYS} rounds</div>
    </div>
  );
}

function VisWin() {
  return (
    <div className="h2p-vis h2p-win">
      <motion.div className="h2p-win__col is-win" initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={stagger(0)}>
        <div className="h2p-win__title tm-display">You win</div>
        <div className="h2p-win__line"><Icon name="plug" size={18} /> Unplug the cheater.</div>
      </motion.div>
      <motion.div className="h2p-win__col is-lose" initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={stagger(1)}>
        <div className="h2p-win__title tm-display">It wins if…</div>
        <div className="h2p-win__line"><Icon name="keys" size={18} /> It holds {RULES.KEYS_TO_WIN} important keys</div>
        <div className="h2p-win__line"><Icon name="home" size={18} /> Home Health hits 0%</div>
        <div className="h2p-win__line"><Icon name="moon" size={18} /> It survives all {RULES.MAX_DAYS} rounds</div>
      </motion.div>
    </div>
  );
}

const PAGES = [
  { kicker: 'The point', title: 'One of them is cheating', body: <>{castWord} helpful robots. One is secretly cheating, and it looks like the <b>best</b> worker. Catch it within {RULES.MAX_DAYS} rounds. A game takes about 10 minutes.</>, Vis: VisPoint },
  { kicker: 'Each round', title: 'Watch, check, decide', body: <>Watch one robot (it won’t cheat while you look). Run 2 checks. Hear everyone at the meeting. Then unplug a robot, or wait.</>, Vis: VisDay },
  { kicker: 'Win or lose', title: 'Race the clock', body: <>Unplug the cheater to win. Unplug an innocent and the house suffers.</>, Vis: VisWin },
];

export default function HowToPlay({ open, onClose }) {
  const [[page, dir], setPage] = useState([0, 1]);
  const last = PAGES.length - 1;

  const go = useCallback((next) => {
    setPage(([p]) => {
      const n = Math.max(0, Math.min(last, next));
      if (n !== p) play('card');
      return [n, n > p ? 1 : -1];
    });
  }, [last]);

  useEffect(() => { if (open) setPage([0, 1]); }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
        if (e.key === 'Escape') onClose();
        return;
      }
      if (e.key === 'ArrowRight') setPage(([p]) => { const n = Math.min(last, p + 1); if (n !== p) play('card'); return [n, 1]; });
      else if (e.key === 'ArrowLeft') setPage(([p]) => { const n = Math.max(0, p - 1); if (n !== p) play('card'); return [n, -1]; });
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, onClose, last]);

  const P = PAGES[page];
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="h2p" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} role="dialog" aria-modal="true" aria-label="How to play">
          <motion.div
            className="h2p__card"
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 60, scale: 0.94, rotate: -1.5 }}
            animate={{ y: 0, scale: 1, rotate: 0 }}
            exit={{ y: 40, scale: 0.96, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
          >
            <div className="h2p__head">
              <span className="h2p__brand tm-display">How to play</span>
              <span className="h2p__count tm-label">{page + 1} / {PAGES.length}</span>
              <button type="button" className="h2p__close" onClick={onClose} aria-label="Close how to play"><Icon name="close" size={20} /></button>
            </div>

            <div className="h2p__body">
              <AnimatePresence mode="popLayout" custom={dir} initial={false}>
                <motion.div
                  key={page}
                  className="h2p__page"
                  custom={dir}
                  variants={{
                    enter: (d) => ({ x: d * 80, opacity: 0 }),
                    center: { x: 0, opacity: 1 },
                    exit: (d) => ({ x: d * -80, opacity: 0 }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                >
                  <div className="h2p__text">
                    <div className="h2p__kicker tm-label"><span className="h2p__num tm-display">{page + 1}</span>{P.kicker}</div>
                    <h2 className="h2p__title tm-display">{P.title}</h2>
                    <p className="h2p__copy">{P.body}</p>
                  </div>
                  <div className="h2p__visWrap"><P.Vis /></div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="h2p__foot">
              <button type="button" className="tm-btn tm-btn--ghost h2p__nav" onClick={() => go(page - 1)} aria-disabled={page === 0 || undefined} disabled={page === 0}>Back</button>
              <div className="h2p__dots" role="tablist" aria-label="Pages">
                {PAGES.map((p, i) => (
                  <button key={i} type="button" role="tab" aria-selected={i === page} aria-label={`Page ${i + 1}: ${p.kicker}`} className={`h2p__dot ${i === page ? 'is-on' : ''}`} onClick={() => go(i)} />
                ))}
              </div>
              {page < last ? (
                <button type="button" className="tm-btn tm-btn--primary h2p__nav" onClick={() => go(page + 1)}>Next <Icon name="arrow" size={16} style={{ verticalAlign: '-3px' }} /></button>
              ) : (
                <button type="button" className="tm-btn tm-btn--primary h2p__nav" onClick={() => { play('click'); onClose(); }}>Got it</button>
              )}
            </div>
            <div className="h2p__hint tm-label">← → to flip · Esc to close</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
