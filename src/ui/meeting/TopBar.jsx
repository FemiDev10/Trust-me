// Slim cinematic header shared by the U2 screens: tag, day, task, Home Health.
import { motion } from 'framer-motion';
import * as engine from '../../engine/index.js';

/** Level info if the engine exports LEVELS, else null (level UI hidden). */
export function levelInfo(id) {
  const levels = engine.LEVELS;
  if (!Array.isArray(levels) || !levels.length || id == null) return null;
  const idx = levels.findIndex((l) => l.id === id);
  if (idx < 0) return null;
  return { ...levels[idx], n: idx + 1, next: levels[idx + 1] ?? null, last: idx === levels.length - 1 };
}

export function HealthMeter({ value, from }) {
  const tone = value > 60 ? 'var(--tm-safe)' : value > 30 ? 'var(--tm-warn)' : 'var(--tm-danger)';
  return (
    <div className="hm" aria-label={`Home Health ${value}%`}>
      <span className="tm-label">Home Health</span>
      <div className="hm__track">
        <motion.div className="hm__bar" style={{ background: tone }} initial={{ width: `${from ?? value}%` }} animate={{ width: `${value}%` }} transition={{ type: 'spring', stiffness: 90, damping: 16, delay: from != null ? 0.6 : 0 }} />
      </div>
      <span className="hm__n tm-display">{value}%</span>
    </div>
  );
}

export default function TopBar({ tag, tone = 'red', day, maxDays, subtitle, health, healthFrom, level }) {
  const lv = levelInfo(level);
  return (
    <header className="tb">
      <span className={`tb__tag tb__tag--${tone} tm-label`}>{tag}</span>
      {lv && <span className="tb__case">Case {lv.n} · <b>{lv.name}</b></span>}
      {day != null && <span className="tb__day tm-display">Day {day}<small>/{maxDays}</small></span>}
      {subtitle && <span className="tb__sub">{subtitle}</span>}
      <span className="tb__grow" />
      {health != null && <HealthMeter value={health} from={healthFrom} />}
    </header>
  );
}
