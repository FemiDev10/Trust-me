import { motion } from 'framer-motion';
import { castById } from '../../engine/index.js';
import Icon from './icons.jsx';
import RobotBadge from './RobotBadge.jsx';
import { CHECK_META } from './meta.js';

/** Stamp text + tone for a card result (purely presentational). */
export function stampFor(card) {
  switch (card.result) {
    case 'missing': return { text: 'Wiped', tone: 'red' };
    case 'charging': return { text: 'Charging', tone: 'ink' };
    case 'caught': return { text: 'On tape', tone: 'red' };
    case 'clip': return { text: 'On tape', tone: 'ink' };
    case 'keys': return { text: `${card.keys?.length ?? 0} keys`, tone: 'ink' };
    case 'yes': return { text: 'Yes', tone: 'red' };
    case 'no': return { text: 'No', tone: 'ink' };
    case 'revealing': return { text: 'Revealing', tone: 'red' };
    case 'safe': return { text: 'Safe', tone: 'green' };
    default: return { text: card.result ?? '', tone: 'ink' };
  }
}

export default function EvidenceCard({ card, variant = 'full', layoutId, rotate = 0, onClick, style, ...motionProps }) {
  const meta = CHECK_META[card.check] ?? { label: card.check, icon: 'task' };
  const robot = castById(card.robotId);
  const stamp = stampFor(card);
  return (
    <motion.div
      layoutId={layoutId}
      className={`ev-card ev-card--${variant} tm-paper`}
      style={{ '--rc': robot?.hex, rotate, ...style }}
      onClick={onClick}
      {...motionProps}
    >
      <div className="ev-card__strip" />
      <div className="ev-card__head">
        <RobotBadge id={card.robotId} size={variant === 'mini' ? 22 : 34} />
        <div className="ev-card__who">
          <span className="ev-card__name">{robot?.name ?? card.robotId}</span>
          <span className="ev-card__check"><Icon name={meta.icon} size={12} /> {meta.label}</span>
        </div>
        <span className="ev-card__day">D{card.day}</span>
      </div>
      {variant !== 'mini' && (
        <>
          <div className="ev-card__headline">{card.headline}</div>
          <div className="ev-card__detail">{card.detail}</div>
          {card.check === 'keys' && card.keys?.length > 0 && (
            <div className="ev-card__keys">{card.keys.map((k) => <span key={k} className="ev-card__key">{k}</span>)}</div>
          )}
        </>
      )}
      <div className={`ev-card__stamp ev-card__stamp--${stamp.tone}`}>{stamp.text}</div>
      {card.shown && variant !== 'mini' && <div className="ev-card__shown">Shown at meeting</div>}
    </motion.div>
  );
}
