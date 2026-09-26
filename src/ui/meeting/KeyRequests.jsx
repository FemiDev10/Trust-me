// What lies on the kitchen table: KEY REQUEST slips (approve / deny) and the evidence
// files the player has shown this meeting. Pending slips are big and pulse; answered
// slips shrink to stamped tokens so the evidence has room.
import { AnimatePresence, motion } from 'framer-motion';
import { castById, keyById, RULES } from '../../engine/index.js';

// Home Health gained per approved key (engine constant; name guarded, defaults to 5).
export const APPROVE_BONUS = Object.entries(RULES ?? {}).find(([k, v]) => /APPROV/i.test(k) && typeof v === 'number')?.[1] ?? 5;
import RobotFace from './RobotFace.jsx';
import { play } from './sound.js';

export function KeyIcon({ size = 26, important }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="10" cy="16" r="7" fill={important ? '#ff3b3b' : '#ffc53d'} stroke="#031012" strokeWidth="2.5" />
      <circle cx="10" cy="16" r="2.5" fill="#031012" />
      <path d="M17 16 H29 M24 16 V21 M28 16 V20" stroke="#031012" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  );
}

const drop = (i, tilt) => ({
  initial: { opacity: 0, y: -70, scale: 1.15, rotate: tilt * 4 },
  animate: { opacity: 1, y: 0, scale: 1, rotate: tilt },
  exit: { opacity: 0, scale: 0.8 },
  transition: { type: 'spring', stiffness: 300, damping: 20, delay: 0.12 * i },
});

function PendingSlip({ r, i, dispatch }) {
  const c = castById(r.robotId);
  const important = keyById(r.key)?.important === true;
  const answer = (approve) => {
    play('click');
    dispatch({ type: 'RESOLVE_REQUEST', requestId: r.id, approve });
  };
  return (
    <motion.div layout className={`slip tm-paper ${important ? 'slip--imp' : ''}`} style={{ '--rc': c?.hex }} {...drop(i, i % 2 ? 1.5 : -1.5)}>
      <span className="slip__pulse" aria-hidden />
      <div className="slip__top">
        <KeyIcon important={important} />
        <div className="slip__key">
          <div className="slip__keyname">{r.keyName}</div>
          <div className={`slip__imp tm-label ${important ? 'is-imp' : ''}`}>{important ? 'Important key' : 'Harmless key'}</div>
        </div>
        <RobotFace id={r.robotId} size={40} />
      </div>
      <div className="slip__quote"><b style={{ color: c?.hex }}>{c?.name}:</b> “{r.text}”</div>
      <div className={`slip__deal ${important ? 'is-imp' : ''}`}>
        Approve: <b>+{APPROVE_BONUS}% Home Health</b> · {important ? <b className="slip__risk">counts toward takeover</b> : 'harmless key'}
      </div>
      <div className="slip__btns">
        <button type="button" className="tm-btn slip__btn slip__btn--ok" aria-label={`Approve: give ${c?.name} the ${r.keyName}. Plus ${APPROVE_BONUS}% Home Health${important ? '. Important key, counts toward takeover' : ''}`} onClick={() => answer(true)}>Approve</button>
        <button type="button" className="tm-btn slip__btn slip__btn--no" aria-label={`Deny ${c?.name} the ${r.keyName}`} onClick={() => answer(false)}>Deny</button>
      </div>
    </motion.div>
  );
}

function DoneSlip({ r, i }) {
  const c = castById(r.robotId);
  const important = keyById(r.key)?.important === true;
  return (
    <motion.div layout className={`token tm-paper token--${r.status}`} style={{ '--rc': c?.hex }} {...drop(0, i % 2 ? 3 : -3)}>
      <KeyIcon size={18} important={important} />
      <span className="token__txt"><b>{c?.name}</b> · {r.keyName}</span>
      <motion.span className="token__stamp tm-display" initial={{ scale: 2.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}>
        {r.status === 'approved' ? 'Approved' : 'Denied'}
      </motion.span>
    </motion.div>
  );
}

const CHECK = { camera: 'Camera', keys: 'Key drawer', question: 'Question', test: 'Surprise test' };

function MiniFile({ card, i }) {
  const c = castById(card.robotId);
  return (
    <motion.div layout className="mini tm-paper" style={{ '--rc': c?.hex }} {...drop(0, [-3, 2.5, -1.5, 3][i % 4])}>
      <div className="mini__tab tm-label">Evidence · {CHECK[card.check] ?? card.check}</div>
      <div className="mini__head"><RobotFace id={card.robotId} size={24} /> <b>{c?.name}</b></div>
      <div className="mini__headline">{card.headline}</div>
    </motion.div>
  );
}

export default function TableSpread({ requests, evidence, dispatch }) {
  const pending = requests.filter((r) => r.status === 'pending');
  const done = requests.filter((r) => r.status !== 'pending');
  const files = evidence.slice(-3);
  const extra = evidence.length - files.length;
  const empty = !requests.length && !evidence.length;

  return (
    <div className="spread">
      <div className="spread__row">
        <AnimatePresence mode="popLayout">
          {pending.map((r, i) => <PendingSlip key={r.id} r={r} i={i} dispatch={dispatch} />)}
          {(done.length > 0 || files.length > 0) && (
            <motion.div layout key="pile" className="spread__pile">
              {done.map((r, i) => <DoneSlip key={r.id} r={r} i={i} />)}
              {files.map((card, i) => <MiniFile key={card.id} card={card} i={i} />)}
              {extra > 0 && <div className="spread__more tm-label">+{extra} more shown</div>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {empty && <div className="spread__hint tm-label">Show evidence to put it on the table</div>}
    </div>
  );
}
