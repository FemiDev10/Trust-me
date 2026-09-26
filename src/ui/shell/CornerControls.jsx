// Global corner controls: "?" (How to play) and a sound popover with two
// toggles (Music, Sound effects). Rendered by the App shell over every screen.
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isMuted, isMusicMuted, setMuted, setMusicMuted, onMuteChange, play } from '../../game/sound.js';
import './shell.css';

const SpeakerIcon = ({ off }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
    {off ? <path d="M17 9l5 6M22 9l-5 6" /> : <><path d="M16.5 8.5a5 5 0 0 1 0 7" /><path d="M19.5 5.5a9 9 0 0 1 0 13" /></>}
  </svg>
);

function Toggle({ label, on, onChange }) {
  return (
    <button type="button" className={`tm-toggle ${on ? 'is-on' : ''}`} role="switch" aria-checked={on} onClick={() => onChange(!on)}>
      <span className="tm-toggle__label">{label}</span>
      <span className="tm-toggle__track"><motion.span className="tm-toggle__knob" layout transition={{ type: 'spring', stiffness: 600, damping: 32 }} /></span>
    </button>
  );
}

const DoorIcon = () => (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M14 4H6v16h8" /><path d="M11 12h10" /><path d="M18 9l3 3-3 3" />
  </svg>
);

export default function CornerControls({ onHelp, showHelp = true, onQuit }) {
  const [state, setState] = useState(() => ({ sfxMuted: isMuted(), musicMuted: isMusicMuted() }));
  const [open, setOpen] = useState(false);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const ref = useRef(null);
  useEffect(() => onMuteChange(setState), []);
  useEffect(() => {
    if (!open && !confirmQuit) return undefined;
    const close = () => { setOpen(false); setConfirmQuit(false); };
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) close(); };
    const onKey = (e) => e.key === 'Escape' && close();
    document.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onDown); window.removeEventListener('keydown', onKey); };
  }, [open, confirmQuit]);

  const allOff = state.sfxMuted && state.musicMuted;
  return (
    <div className="tm-corner" ref={ref}>
      <div className="tm-corner__sound">
        <motion.button
          type="button"
          className="tm-mute"
          onClick={() => setOpen((o) => !o)}
          whileHover={{ scale: 1.08, rotate: -4 }}
          whileTap={{ scale: 0.9 }}
          aria-expanded={open}
          aria-label="Sound settings"
          title="Sound"
        >
          <SpeakerIcon off={allOff} />
        </motion.button>
        <AnimatePresence>
          {open && (
            <motion.div
              className="tm-soundpop"
              initial={{ opacity: 0, scale: 0.8, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: -4 }}
              transition={{ type: 'spring', stiffness: 520, damping: 30 }}
            >
              <div className="tm-label tm-soundpop__title">Sound</div>
              <Toggle label="Music" on={!state.musicMuted} onChange={(on) => setMusicMuted(!on)} />
              <Toggle label="Sound effects" on={!state.sfxMuted} onChange={(on) => { setMuted(!on); if (on) play('click'); }} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {showHelp && (
        <motion.button
          type="button"
          className="tm-mute tm-help"
          onClick={() => { play('click'); setOpen(false); onHelp(); }}
          whileHover={{ scale: 1.08, rotate: 4 }}
          whileTap={{ scale: 0.9 }}
          aria-label="How to play"
          title="How to play"
        >
          ?
        </motion.button>
      )}
      {onQuit && (
        <div className="tm-corner__sound">
          <motion.button
            type="button"
            className="tm-mute tm-quit"
            onClick={() => { play('click'); setOpen(false); setConfirmQuit((q) => !q); }}
            whileHover={{ scale: 1.08, rotate: -4 }}
            whileTap={{ scale: 0.9 }}
            aria-expanded={confirmQuit}
            aria-label="Leave this case"
            title="Leave this case"
          >
            <DoorIcon />
          </motion.button>
          <AnimatePresence>
            {confirmQuit && (
              <motion.div
                className="tm-soundpop tm-quitpop"
                role="dialog"
                aria-label="Leave this case?"
                initial={{ opacity: 0, scale: 0.8, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: -4 }}
                transition={{ type: 'spring', stiffness: 520, damping: 30 }}
              >
                <div className="tm-label tm-soundpop__title">Leave this case?</div>
                <p className="tm-quitpop__text">Your progress is saved. Pick it up again with Continue case on the title screen.</p>
                <div className="tm-quitpop__row">
                  <button type="button" className="tm-btn tm-btn--ghost tm-quitpop__btn" onClick={() => setConfirmQuit(false)}>Stay</button>
                  <button type="button" className="tm-btn tm-btn--danger tm-quitpop__btn" onClick={() => { setConfirmQuit(false); onQuit(); }}>Leave</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
