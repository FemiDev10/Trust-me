import { useEffect, useRef } from 'react';
import { motion, useAnimationControls, AnimatePresence } from 'framer-motion';
import { roomName } from '../../engine/index.js';
import Icon from './icons.jsx';
import AnimatedNumber from './AnimatedNumber.jsx';
import { scenarioIcon } from './meta.js';

const spring = { type: 'spring', stiffness: 380, damping: 24 };

export function TaskCard({ scenario, day }) {
  if (!scenario) return null;
  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key={scenario.id}
        className="hud-task tm-paper"
        initial={{ y: -80, rotate: -6, opacity: 0 }}
        animate={{ y: 0, rotate: -1.5, opacity: 1 }}
        exit={{ y: -80, opacity: 0 }}
        transition={{ ...spring, delay: 0.1 }}
        whileHover={{ rotate: 0, scale: 1.02 }}
      >
        <div className="hud-task__icon"><Icon name={scenarioIcon(scenario.id)} size={26} /></div>
        <div className="hud-task__body">
          <div className="hud-task__kicker">Today’s task · Day {day}</div>
          <div className="hud-task__title">{scenario.title}</div>
          <div className="hud-task__room"><Icon name="pin" size={13} /> {roomName(scenario.room)}</div>
        </div>
        <div className="hud-task__tape" />
      </motion.div>
    </AnimatePresence>
  );
}

export function DayCounter({ day, maxDays }) {
  return (
    <motion.div className="hud-day" initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={spring}>
      <div className="hud-day__label tm-display">
        Day <AnimatePresence mode="popLayout"><motion.span key={day} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -30, opacity: 0 }} transition={spring} className="hud-day__num">{day}</motion.span></AnimatePresence>
        <span className="hud-day__of">/{maxDays}</span>
      </div>
      <div className="hud-day__pips">
        {Array.from({ length: maxDays }, (_, i) => (
          <motion.span
            key={i}
            className={`hud-day__pip ${i + 1 < day ? 'is-done' : ''} ${i + 1 === day ? 'is-now' : ''}`}
            initial={false}
            animate={{ scale: i + 1 === day ? 1.25 : 1 }}
            transition={spring}
          />
        ))}
      </div>
    </motion.div>
  );
}

export function HealthMeter({ value }) {
  const controls = useAnimationControls();
  const prev = useRef(value);
  const danger = value <= 50;
  useEffect(() => {
    if (value < prev.current) {
      controls.start({ x: [0, -9, 8, -6, 4, 0], transition: { duration: 0.5 } });
    }
    prev.current = value;
  }, [value, controls]);
  return (
    <motion.div
      className={`hud-health ${danger ? 'is-danger' : ''}`}
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ ...spring, delay: 0.05 }}
    >
      <motion.div animate={controls}>
        <div className="hud-health__head">
          <span className="hud-health__label"><Icon name="home" size={15} /> Home health</span>
          <AnimatedNumber value={value} suffix="%" className="hud-health__num tm-display" />
        </div>
        <div className="hud-health__track">
          <motion.div
            className="hud-health__fill"
            initial={false}
            animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
          />
          <div className="hud-health__ticks" />
        </div>
      </motion.div>
    </motion.div>
  );
}
