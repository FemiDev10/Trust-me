import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EvidenceCard from './EvidenceCard.jsx';
import Icon from './icons.jsx';
import { play } from '../../game/sound.js';

/** Mini stack in the dock. Click fans every card out across the screen. */
export function EvidenceTray({ cards, hiddenId, open, onToggle }) {
  const visible = cards.filter((c) => c.id !== hiddenId);
  const stack = visible.slice(-4);
  return (
    <button
      type="button"
      className={`ev-tray ${open ? 'is-open' : ''}`}
      onClick={(e) => { e.stopPropagation(); play('card'); onToggle(); }}
      aria-expanded={open}
      aria-label={`Evidence, ${visible.length} card${visible.length === 1 ? '' : 's'}`}
    >
      <div className="ev-tray__label tm-label"><Icon name="cards" size={14} /> Evidence</div>
      <div className="ev-tray__stack">
        {stack.length === 0 && <div className="ev-tray__empty">No evidence yet</div>}
        {stack.map((c, i) => (
          <EvidenceCard
            key={c.id}
            card={c}
            variant="mini"
            layoutId={`ev-${c.id}`}
            style={{ left: i * 26, zIndex: i, position: 'absolute' }}
            rotate={(i - (stack.length - 1) / 2) * 5}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          />
        ))}
      </div>
      <motion.span key={visible.length} className="ev-tray__count" initial={{ scale: 1.8 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 15 }}>
        {visible.length}
      </motion.span>
    </button>
  );
}

/** Full-screen fan of every evidence card, grouped by day. Click outside to close. */
export function EvidenceSpread({ cards, open, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const days = [...new Set(cards.map((c) => c.day))];
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="ev-spread" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="ev-spread__inner" onClick={(e) => e.stopPropagation()}>
            <div className="ev-spread__head">
              <h2 className="tm-display">Case file</h2>
              <span className="tm-label">{cards.length} card{cards.length === 1 ? '' : 's'} · show them at the meeting</span>
              <button type="button" className="ev-spread__close" onClick={onClose} aria-label="Close evidence"><Icon name="close" size={20} /></button>
            </div>
            {cards.length === 0 && <p className="ev-spread__empty">Nothing yet. Run a check in a glowing room to collect evidence.</p>}
            {days.map((d) => (
              <div key={d} className="ev-spread__day">
                <div className="ev-spread__dayLabel tm-display">Day {d}</div>
                <div className="ev-spread__cards">
                  {cards.filter((c) => c.day === d).map((c, i) => (
                    <EvidenceCard
                      key={c.id}
                      card={c}
                      initial={{ y: 220, rotate: -20 + i * 6, opacity: 0, scale: 0.7 }}
                      animate={{ y: 0, rotate: ((i * 37) % 7) - 3, opacity: 1, scale: 1 }}
                      exit={{ y: 200, opacity: 0, scale: 0.8 }}
                      whileHover={{ rotate: 0, y: -8, scale: 1.04, zIndex: 5 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 22, delay: i * 0.05 }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
