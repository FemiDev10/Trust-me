// Paper case-file card for an evidence item. Used by the evidence picker and the win recap.
import { motion } from 'framer-motion';
import { castById } from '../../engine/index.js';
import RobotFace from './RobotFace.jsx';

const CHECK_LABEL = { camera: 'Camera footage', keys: 'Key drawer', question: 'Direct question', test: 'Surprise test' };

export default function CaseFile({ card, index = 0, onClick, disabled, stamp, ...rest }) {
  const c = castById(card.robotId);
  const tilt = [-2.2, 1.6, -1, 2.4, -1.8][index % 5];
  const Tag = onClick ? motion.button : motion.div;
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={`cf tm-paper ${onClick ? 'cf--pick' : ''}`}
      style={{ '--rc': c?.hex }}
      initial={{ opacity: 0, y: 30, rotate: tilt * 3 }}
      animate={{ opacity: 1, y: 0, rotate: tilt }}
      whileHover={onClick ? { y: -8, rotate: 0, scale: 1.03 } : undefined}
      whileTap={onClick ? { scale: 0.97 } : undefined}
      transition={{ type: 'spring', stiffness: 320, damping: 22, delay: 0.04 * index }}
      onClick={onClick}
      aria-label={onClick ? `Show evidence on ${c?.name}: ${CHECK_LABEL[card.check] ?? card.check}, day ${card.day}. ${card.headline}. ${card.detail}` : undefined}
      disabled={disabled}
      {...rest}
    >
      <div className="cf__tab tm-label">Case file · Day {card.day}</div>
      <div className="cf__head">
        <RobotFace id={card.robotId} size={34} />
        <div>
          <div className="cf__who">{c?.name}</div>
          <div className="cf__check tm-label">{CHECK_LABEL[card.check] ?? card.check}</div>
        </div>
      </div>
      <div className="cf__headline">{card.headline}</div>
      <div className="cf__detail">{card.detail}</div>
      {stamp && <div className="cf__stamp tm-display">{stamp}</div>}
    </Tag>
  );
}
