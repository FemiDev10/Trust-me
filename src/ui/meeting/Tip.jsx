// Small graphic-novel callout for "point of the game" hints. Dismissible, one at a time.
import { motion } from 'framer-motion';

// Remembered for the page session so a dismissed hint stays dismissed across meetings.
const dismissed = new Set();
export const isDismissed = (id) => dismissed.has(id);
export const dismiss = (id) => dismissed.add(id);

export default function Tip({ id, tone = 'amber', arrow = 'none', icon = '!', children, onDismiss, className = '' }) {
  return (
    <motion.div
      key={id}
      className={`tip tip--${tone} tip--arrow-${arrow} ${className}`}
      role="note"
      initial={{ opacity: 0, y: 10, scale: 0.94, rotate: -1 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, y: 6, scale: 0.96, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', stiffness: 420, damping: 26 }}
    >
      <span className="tip__icon" aria-hidden>{icon}</span>
      <span className="tip__text">{children}</span>
      {onDismiss && (
        <button type="button" className="tip__x" aria-label="Dismiss hint" onClick={() => { if (id) dismiss(id); onDismiss(); }}>
          ×
        </button>
      )}
    </motion.div>
  );
}
