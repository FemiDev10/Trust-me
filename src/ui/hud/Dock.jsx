import { motion, AnimatePresence } from 'framer-motion';
import Icon from './icons.jsx';

export function ApMeter({ ap, max = 3, active }) {
  return (
    <div className={`dock-ap ${active ? 'is-active' : ''}`} aria-label={`${ap} of ${max} action points`}>
      <div className="dock-ap__label tm-label">Action pts</div>
      <div className="dock-ap__pips">
        {Array.from({ length: max }, (_, i) => {
          const on = i < ap;
          return (
            <motion.span
              key={i}
              className={`dock-ap__pip ${on ? 'is-on' : ''}`}
              initial={false}
              animate={on ? { scale: 1, rotate: 45 } : { scale: [1.5, 0.85], rotate: 45 }}
              transition={{ type: 'spring', stiffness: 500, damping: 16 }}
            />
          );
        })}
      </div>
    </div>
  );
}

/** Context-aware action buttons; `actions` = [{ id, label, icon, onClick, disabled, reason, kind, sub }] */
export function DockActions({ title, actions }) {
  return (
    <div className="dock-actions">
      {title && <div className="dock-actions__title tm-label">{title}</div>}
      <div className="dock-actions__row">
        <AnimatePresence mode="popLayout" initial={false}>
          {actions.map((a, i) => (
            <motion.button
              key={a.id}
              type="button"
              layout
              className={`dock-btn ${a.kind ? `dock-btn--${a.kind}` : ''}`}
              aria-disabled={a.disabled || undefined}
              title={a.disabled ? a.reason : a.title}
              onClick={a.onClick}
              initial={{ y: 40, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 30, opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 420, damping: 24, delay: i * 0.04 }}
              whileHover={a.disabled ? undefined : { y: -4 }}
              whileTap={a.disabled ? { x: [0, -4, 4, 0] } : { scale: 0.94, y: 2 }}
            >
              {a.icon && <Icon name={a.icon} size={22} />}
              <span className="dock-btn__text">
                <span className="dock-btn__label">{a.label}</span>
                {(a.sub || (a.disabled && a.reason)) && <span className="dock-btn__sub">{a.disabled ? a.reason : a.sub}</span>}
              </span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function CallMeetingButton({ enabled, apLeft, confirming, onClick, onCancel }) {
  return (
    <div className="dock-meeting">
      <AnimatePresence>
        {confirming && (
          <motion.div className="dock-meeting__confirm tm-paper" initial={{ y: 20, opacity: 0, scale: 0.8 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 10, opacity: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 22 }} onClick={(e) => e.stopPropagation()}>
            You still have <b>{apLeft} AP</b>. Unused points are lost.
            <div className="dock-meeting__confirmRow">
              <button type="button" className="tm-btn tm-btn--ghost dock-meeting__small" onClick={onCancel}>Keep looking</button>
              <button type="button" className="tm-btn tm-btn--danger dock-meeting__small" onClick={() => onClick(true)}>Call it</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        type="button"
        className="dock-meeting__btn"
        aria-disabled={!enabled || undefined}
        title={enabled ? 'Sound the alarm and gather everyone at the kitchen table' : 'Finish today’s work first'}
        onClick={(e) => { e.stopPropagation(); onClick(false); }}
        whileHover={enabled ? { scale: 1.05, rotate: -1.5 } : undefined}
        whileTap={enabled ? { scale: 0.92 } : undefined}
        animate={enabled ? { boxShadow: ['0 5px 0 #031012, 0 0 0 0 rgba(255,59,59,0.6)', '0 5px 0 #031012, 0 0 0 14px rgba(255,59,59,0)'] } : {}}
        transition={enabled ? { duration: 1.6, repeat: Infinity } : undefined}
      >
        <Icon name="alarm" size={26} />
        <span>Call<br />meeting</span>
      </motion.button>
    </div>
  );
}
