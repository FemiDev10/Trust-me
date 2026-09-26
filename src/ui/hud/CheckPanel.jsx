import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { roomName } from '../../engine/index.js';
import Icon from './icons.jsx';
import RobotBadge from './RobotBadge.jsx';
import { CHECK_META } from './meta.js';

/**
 * Investigation panel for one check type. `choices` is
 * [{ robot, enabled, reason }] computed from engine getAvailableActions.
 */
export default function CheckPanel({ check, choices, ap, onPick, onClose, onHover }) {
  useEffect(() => {
    if (!check) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [check, onClose]);

  const meta = check ? CHECK_META[check] : null;
  return (
    <AnimatePresence>
      {check && (
        <motion.div key="scrim" className="hud-scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            key={check}
            className="check-panel"
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 60, scale: 0.9, rotate: -2, opacity: 0 }}
            animate={{ y: 0, scale: 1, rotate: 0, opacity: 1 }}
            exit={{ y: 40, scale: 0.94, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 24 }}
            role="dialog"
            aria-label={meta.label}
          >
            <div className="check-panel__head">
              <div className="check-panel__icon"><Icon name={meta.icon} size={30} /></div>
              <div>
                <div className="tm-label">{roomName(meta.room)} · costs 1 AP</div>
                <h2 className="check-panel__title tm-display">{meta.label}</h2>
              </div>
              <div className="check-panel__ap"><span className="tm-display">{ap}</span> AP left</div>
              <button type="button" className="check-panel__close" onClick={onClose} aria-label="Close"><Icon name="close" size={20} /></button>
            </div>
            <p className="check-panel__blurb">{meta.blurb}</p>
            <div className="tm-label check-panel__who">Who do you check?</div>
            <motion.div className="check-panel__robots" style={{ "--n": choices.length }} initial="h" animate="s" variants={{ h: {}, s: { transition: { staggerChildren: 0.05 } } }}>
              {choices.map(({ robot, enabled, reason }) => (
                <motion.button
                  key={robot.id}
                  type="button"
                  className={`check-robot ${enabled ? '' : 'is-disabled'}`}
                  style={{ '--rc': robot.hex }}
                  aria-disabled={!enabled}
                  title={enabled ? `Check ${robot.name}` : reason}
                  variants={{ h: { y: 24, opacity: 0 }, s: { y: 0, opacity: 1 } }}
                  whileHover={enabled ? { y: -6, rotate: -2 } : undefined}
                  whileTap={enabled ? { scale: 0.94 } : { x: [0, -5, 5, 0] }}
                  onMouseEnter={() => onHover?.(robot.id)}
                  onMouseLeave={() => onHover?.(null)}
                  onClick={() => onPick(robot.id, enabled, reason)}
                >
                  <RobotBadge id={robot.id} size={54} off={robot.status === 'unplugged'} />
                  <span className="check-robot__name">{robot.name}</span>
                  <span className="check-robot__reason">{enabled ? (robot.status === 'sittingOut' ? 'Sitting out' : 'Check') : reason}</span>
                </motion.button>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
