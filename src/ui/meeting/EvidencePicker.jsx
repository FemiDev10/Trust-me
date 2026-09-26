// Overlay: pick one evidence card to show the table. Click outside to close.
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import CaseFile from './CaseFile.jsx';
import { play } from './sound.js';

export default function EvidencePicker({ cards, onPick, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <motion.div className="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        className="ev"
        role="dialog"
        aria-modal="true"
        aria-label="Show evidence: pick a case file"
        initial={{ y: 40, scale: 0.96 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 30, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ev__head">
          <div>
            <div className="tm-label">Show evidence</div>
            <h2 className="tm-display ev__title">Put a file on the table</h2>
            <p className="ev__sub">The others will react. Solid evidence makes them suspicious of that robot too.</p>
          </div>
          <button type="button" className="tm-btn tm-btn--ghost" onClick={onClose}>Close</button>
        </div>
        {cards.length === 0 ? (
          <div className="ev__empty">No unshown evidence. Investigate during the day to fill your case files.</div>
        ) : (
          <div className="ev__grid">
            {cards.map((card, i) => (
              <CaseFile key={card.id} card={card} index={i} onClick={() => { play('card'); onPick(card.id); }} />
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
