import { motion } from 'framer-motion';
import './shell.css';

/** Animated teal-night backdrop: glow pools, drifting halftone, scanlines, grain. */
export default function Backdrop({ tone = 'teal' }) {
  return (
    <div className={`tm-backdrop tm-backdrop--${tone}`} aria-hidden>
      <motion.div
        className="tm-backdrop__glow tm-backdrop__glow--a"
        animate={{ x: ['-6%', '6%', '-6%'], y: ['-4%', '3%', '-4%'], scale: [1, 1.12, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="tm-backdrop__glow tm-backdrop__glow--b"
        animate={{ x: ['5%', '-5%', '5%'], opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="tm-backdrop__halftone" />
      <div className="tm-backdrop__scan" />
      <div className="tm-backdrop__vignette" />
    </div>
  );
}
