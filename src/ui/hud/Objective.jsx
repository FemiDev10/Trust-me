// Always-visible objective chip under the day counter. Click to expand a
// "Win / lose" card with live threat meters. Never reveals who the cheater is.
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { castById } from '../../engine/index.js';
import Icon from './icons.jsx';
import RobotBadge from './RobotBadge.jsx';
import AnimatedNumber from './AnimatedNumber.jsx';

export default function Objective({ open, onToggle, onClose, day, maxDays, homeHealth, importantKeys, keysToWin }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onDown); window.removeEventListener('keydown', onKey); };
  }, [open, onClose]);

  const maxKeys = Math.max(0, ...importantKeys.map((k) => k.count));
  const daysLeft = Math.max(0, maxDays - day + 1);
  const keyDanger = maxKeys >= keysToWin - 1;
  const healthDanger = homeHealth <= 50;
  const lastDay = day >= maxDays;
  const alert = keyDanger || healthDanger || lastDay;

  return (
    <div className="obj" ref={ref}>
      <motion.button
        type="button"
        className={`obj__chip ${alert ? 'is-alert' : ''}`}
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        aria-expanded={open}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 26, delay: 0.2 }}
        whileHover={{ y: 1, scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
      >
        <span className="obj__dot" />
        Find the cheater · Day {day}/{maxDays}
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="obj__chev">▾</motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="obj__card"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: -10, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 460, damping: 30 }}
          >
            <div className="obj__win"><span className="obj__tag obj__tag--win">You win</span> Unplug the cheater.</div>
            <div className="obj__loseTitle"><span className="obj__tag obj__tag--lose">It wins</span> if any of these hit the line:</div>

            <div className={`obj__meter ${keyDanger ? 'is-danger' : ''}`}>
              <div className="obj__meterHead"><Icon name="keys" size={15} /> Keys to takeover <b className="tm-display">{maxKeys}/{keysToWin}</b></div>
              <div className="obj__pips">
                {Array.from({ length: keysToWin }, (_, i) => <span key={i} className={`obj__pip ${i < maxKeys ? 'is-on' : ''}`} />)}
              </div>
              <div className="obj__keys">
                {importantKeys.map((k) => (
                  <span key={k.id} className={`obj__key ${k.count ? 'has' : ''}`} title={`${castById(k.id)?.name}: ${k.count} important key${k.count === 1 ? '' : 's'}`}>
                    <RobotBadge id={k.id} size={20} off={k.off} /> {k.count}
                  </span>
                ))}
              </div>
              <div className="obj__note">Most important keys held by any one robot.</div>
            </div>

            <div className={`obj__meter ${healthDanger ? 'is-danger' : ''}`}>
              <div className="obj__meterHead"><Icon name="home" size={15} /> Home Health <b className="tm-display"><AnimatedNumber value={homeHealth} suffix="%" /></b></div>
              <div className="obj__bar"><motion.div className="obj__barFill" initial={false} animate={{ width: `${Math.max(0, homeHealth)}%` }} /></div>
              <div className="obj__note">Loses at 0%. Cheating and wrong unplugs hurt it.</div>
            </div>

            <div className={`obj__meter ${lastDay ? 'is-danger' : ''}`}>
              <div className="obj__meterHead"><Icon name="moon" size={15} /> Days left <b className="tm-display">{daysLeft}</b></div>
              <div className="obj__pips">
                {Array.from({ length: maxDays }, (_, i) => <span key={i} className={`obj__pip obj__pip--day ${i >= day - 1 ? 'is-on' : ''}`} />)}
              </div>
              <div className="obj__note">{lastDay ? 'Today is the last day.' : 'Including today. It wins if it survives them all.'}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
