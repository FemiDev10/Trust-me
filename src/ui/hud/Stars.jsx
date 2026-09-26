import { motion } from 'framer-motion';
import Icon from './icons.jsx';

/** 1-5 stars that pop in one by one (delay offsets the whole row). */
export default function Stars({ score, size = 14, delay = 0, animateIn = true }) {
  return (
    <span className="hud-stars" aria-label={`${score} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <motion.span
          key={i}
          className={`hud-stars__s ${i < score ? 'is-on' : ''}`}
          initial={animateIn ? { scale: 0, rotate: -40 } : false}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 520, damping: 14, delay: delay + i * 0.07 }}
        >
          <Icon name="star" size={size} />
        </motion.span>
      ))}
    </span>
  );
}
