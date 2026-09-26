import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CAST } from '../../engine/index.js';
import { RobotPortrait } from '../../game/modules.js';
import { play } from '../../game/sound.js';
import Guarded from '../shell/Guarded.jsx';
import RobotBadge from '../hud/RobotBadge.jsx';
import './RoleReveal.css';
import { castWordLower } from '../../game/copy.js';

export default function RoleRevealScreen({ dispatch, onHelp }) {
  const [flipped, setFlipped] = useState(false);
  const [castIn, setCastIn] = useState(false);

  const flippedRef = useRef(false);
  const flip = useCallback(() => {
    if (flippedRef.current) return;
    flippedRef.current = true;
    setFlipped(true);
    play('pollFlip');
    setTimeout(() => setCastIn(true), 650);
  }, []);

  useEffect(() => {
    const t = setTimeout(flip, 900);
    return () => clearTimeout(t);
  }, [flip]);

  const begin = () => {
    play('click');
    dispatch({ type: 'START' });
  };

  return (
    <div className="reveal-role">
      <div className="reveal-role__desk" aria-hidden />
      <div className="reveal-role__stage">
        <motion.div
          className="reveal-role__cardWrap"
          initial={{ y: 300, rotate: -12, scale: 0.7 }}
          animate={{ y: 0, rotate: flipped ? -1.5 : 3, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          onClick={flip}
        >
          <motion.div
            className="reveal-role__card"
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 14 }}
          >
            {/* back: the closed folder */}
            <div className="reveal-role__face reveal-role__back">
              <span className="reveal-role__backTab">Dossier</span>
              <div className="reveal-role__backStamp">Classified</div>
              <div className="reveal-role__backNote">Your role · open to read</div>
            </div>
            {/* front: the dossier page */}
            <div className="reveal-role__face reveal-role__front">
              <div className="reveal-role__head">
                <span>Dossier · Subject 00</span><span>Case 0927-H</span>
              </div>
              <div className="reveal-role__you tm-display">You are<br /><span>the human</span></div>
              <dl className="reveal-role__fields">
                <div><dt>Status</dt><dd>The only human in the house.</dd></div>
                <div><dt>Brief</dt><dd>One of these {castWordLower} robots is secretly <b>cheating</b>. Catch it within <b>3 rounds</b> (in-game days).</dd></div>
                <div><dt>Each round</dt><dd>Watch one room. Run 3 checks. Hold a meeting. Make your call.</dd></div>
                <div><dt>Length</dt><dd>A full game takes about 10 minutes.</dd></div>
              </dl>
              <div className="reveal-role__stamp">Top secret</div>
            </div>
          </motion.div>
        </motion.div>

        <AnimatePresence>
          {castIn && (
            <motion.div className="reveal-role__side" initial="h" animate="s" variants={{ h: {}, s: { transition: { staggerChildren: 0.1 } } }}>
              <motion.div className="reveal-role__suspects" variants={{ h: { opacity: 0 }, s: { opacity: 1 } }}>Suspects on file</motion.div>
              <div className="reveal-role__cast" style={{ "--n": CAST.length }}>
                {CAST.map((c, i) => (
                  <motion.div
                    key={c.id}
                    className="reveal-role__bot"
                    style={{ '--rc': c.hex, '--tilt': `${(i % 2 ? 1 : -1) * (1 + (i % 3))}deg` }}
                    variants={{ h: { y: 40, opacity: 0 }, s: { y: 0, opacity: 1 } }}
                    transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                    onAnimationStart={() => play('step')}
                    whileHover={{ y: -6 }}
                  >
                    <div className="reveal-role__portrait">
                      <Guarded component={RobotPortrait} name="RobotPortrait" id={c.id} pose="idle" expression="neutral" size="100%" fallback={<RobotBadge id={c.id} size={76} />} />
                    </div>
                    <div className="reveal-role__plate"><span className="tm-display">{c.name}</span><small>#{String(i + 1).padStart(2, '0')}</small></div>
                    <div className="reveal-role__vibe">{c.vibe}</div>
                  </motion.div>
                ))}
              </div>
              <motion.div className="reveal-role__actions" variants={{ h: { opacity: 0, y: 10 }, s: { opacity: 1, y: 0 } }}>
                <motion.button
                  type="button"
                  className="reveal-role__go"
                  whileHover={{ y: -4, rotate: -1 }}
                  whileTap={{ y: 2, scale: 0.98 }}
                  onClick={begin}
                >
                  <span className="reveal-role__goStamp">Begin round 1</span>
                  <small>of 3 · in-game day 1</small>
                </motion.button>
                {onHelp && (
                  <button type="button" className="reveal-role__help" onClick={() => { play('click'); onHelp(); }}>
                    New here? <b>How to play</b> (1 min)
                  </button>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
