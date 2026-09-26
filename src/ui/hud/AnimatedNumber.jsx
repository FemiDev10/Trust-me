import { useEffect } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'framer-motion';

/** Tweens between values; renders an integer (plus optional suffix). */
export default function AnimatedNumber({ value, suffix = '', duration = 0.9, className }) {
  const mv = useMotionValue(value);
  const text = useTransform(mv, (v) => `${Math.round(v)}${suffix}`);
  useEffect(() => {
    const controls = animate(mv, value, { duration, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [mv, value, duration]);
  return <motion.span className={className}>{text}</motion.span>;
}
