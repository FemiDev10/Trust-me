// Alarm transition: red wash, halftone sweep, slammed EMERGENCY MEETING type, then it clears.
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { play } from './sound.js';

const slam = { type: 'spring', stiffness: 520, damping: 22, mass: 0.9 };

export default function AlarmIntro({ day, onDone }) {
  useEffect(() => {
    play('alarm');
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      className="alarm"
      onClick={onDone}
      initial={{ opacity: 1 }}
      exit={{ clipPath: 'inset(0 0 100% 0)', transition: { duration: 0.55, ease: [0.7, 0, 0.3, 1] } }}
      style={{ clipPath: 'inset(0 0 0% 0)' }}
    >
      <motion.div
        className="alarm__wash"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0.75, 1, 0.85, 1] }}
        transition={{ duration: 1.4, times: [0, 0.08, 0.2, 0.3, 0.5, 1] }}
      />
      <motion.div
        className="alarm__sweep tm-halftone"
        initial={{ x: '-120%' }}
        animate={{ x: '120%' }}
        transition={{ duration: 1.1, ease: [0.6, 0, 0.2, 1], delay: 0.1 }}
      />
      <div className="alarm__stripes" />
      <motion.div
        className="alarm__stack"
        animate={{ x: [0, -10, 9, -6, 4, 0], y: [0, 5, -4, 3, 0, 0] }}
        transition={{ duration: 0.45, delay: 0.45 }}
      >
        <motion.div className="alarm__kicker tm-label" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          Day {day} · Kitchen table · All robots report
        </motion.div>
        <motion.h1 className="alarm__word tm-display" initial={{ scale: 3.2, opacity: 0, rotate: -8 }} animate={{ scale: 1, opacity: 1, rotate: -3 }} transition={{ ...slam, delay: 0.3 }}>
          Emergency
        </motion.h1>
        <motion.h1 className="alarm__word alarm__word--b tm-display" initial={{ scale: 3.2, opacity: 0, rotate: 6 }} animate={{ scale: 1, opacity: 1, rotate: 2 }} transition={{ ...slam, delay: 0.5 }}>
          Meeting
        </motion.h1>
        <motion.div className="alarm__rule" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.8, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }} />
      </motion.div>
      <motion.div className="alarm__skip tm-label" initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} transition={{ delay: 1.2 }}>
        Click to skip
      </motion.div>
    </motion.div>
  );
}
