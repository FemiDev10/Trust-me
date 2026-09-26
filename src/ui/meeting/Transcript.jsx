// Comic-style transcript. Lines arrive staggered, as if each robot is typing.
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { castById } from '../../engine/index.js';
import RobotFace from './RobotFace.jsx';

const KIND_TAG = { request: 'Key request', poll: 'Poll', statement: null, reply: null, player: null };

/** Reveals transcript lines one by one. Returns { revealed, typingLine }. */
export function useStagger(lines, active, fast = false) {
  const [revealed, setRevealed] = useState(0);
  const total = lines.length;
  const next = lines[revealed];
  useEffect(() => {
    if (!active || revealed >= total) return undefined;
    const isPlayer = next?.speaker === 'HUMAN';
    const len = next?.text?.length ?? 40;
    const delay = fast ? 120 : isPlayer ? 260 : 480 + Math.min(len * 11, 1100);
    const t = setTimeout(() => setRevealed((r) => Math.min(r + 1, total)), delay);
    return () => clearTimeout(t);
  }, [active, revealed, total, next, fast]);
  return { revealed: Math.min(revealed, total), typingLine: active && revealed < total ? next : null, skip: () => setRevealed(total) };
}

function Bubble({ line }) {
  const you = line.speaker === 'HUMAN';
  const c = castById(line.speaker);
  const tag = KIND_TAG[line.kind];
  return (
    <motion.div
      layout
      className={`bb ${you ? 'bb--you' : ''} bb--${line.kind}`}
      initial={{ opacity: 0, y: 14, scale: 0.92, rotate: you ? 1.5 : -1.5 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      style={{ '--rc': c?.hex ?? 'var(--tm-ai)' }}
    >
      {!you && <RobotFace id={line.speaker} pose="talk" size={38} className="bb__face" />}
      <div className="bb__body">
        <div className="bb__who tm-label">
          {you ? 'You' : c?.name}
          {tag && <span className="bb__tag">{tag}</span>}
        </div>
        <div className="bb__text">{line.text}</div>
      </div>
    </motion.div>
  );
}

export default function Transcript({ lines, revealed, typingLine }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [revealed, typingLine]);

  return (
    <div className="tx" ref={ref}>
      <div className="tx__head tm-label">Transcript</div>
      {lines.slice(0, revealed).map((l, i) => (
        <Bubble key={i} line={l} />
      ))}
      <AnimatePresence>
        {typingLine && (
          <motion.div
            key={`typing-${revealed}`}
            className={`bb bb--typing ${typingLine.speaker === 'HUMAN' ? 'bb--you' : ''}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.08 } }}
            style={{ '--rc': castById(typingLine.speaker)?.hex ?? 'var(--tm-ai)' }}
          >
            {typingLine.speaker !== 'HUMAN' && <RobotFace id={typingLine.speaker} pose="talk" size={38} className="bb__face" />}
            <div className="bb__body">
              <span className="dots"><i /><i /><i /></span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
