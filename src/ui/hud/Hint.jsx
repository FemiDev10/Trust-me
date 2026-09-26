import { motion, AnimatePresence } from 'framer-motion';
import Icon from './icons.jsx';

/** Small dismissible Day-1 callout with a pointer arrow. */
export default function Hint({ id, show, onDismiss, children, className = '', arrow = 'down', tag = 'Tip', tone }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={id}
          className={`hud-hint hud-hint--${arrow} ${tone ? `hud-hint--${tone}` : ''} ${className}`}
          initial={{ scale: 0.6, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.7, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 20, delay: 0.5 }}
          onClick={(e) => e.stopPropagation()}
        >
          <span className="hud-hint__tag">{tag}</span>
          <span className="hud-hint__text">{children}</span>
          <button type="button" className="hud-hint__x" onClick={() => onDismiss(id)} aria-label="Dismiss tip"><Icon name="close" size={14} /></button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
