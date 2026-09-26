// Minimal, still-styled stand-ins for U2's screens (meeting, decision, dayEnd,
// ending) so the game can always be played to the end. Used only when the real
// screen file is missing or crashes. Renders selectors, dispatches engine actions.
import { motion } from 'framer-motion';
import {
  getMeeting, getEvidence, getRobots, getLastDecision, getEnding, ASK_TOPICS, castById,
} from '../../engine/index.js';
import { play } from '../../game/sound.js';
import Backdrop from './Backdrop.jsx';
import './shell.css';

const nm = (id) => (id === 'HUMAN' ? 'YOU' : castById(id)?.name ?? id);

function Btn({ kind, onClick, children, disabled }) {
  return (
    <button
      type="button"
      className={`tm-btn ${kind ? `tm-btn--${kind}` : ''}`}
      aria-disabled={disabled || undefined}
      onClick={() => { if (disabled) return; play('click'); onClick(); }}
    >
      {children}
    </button>
  );
}

function Frame({ tone, children }) {
  return (
    <div className="tm-fallback">
      <Backdrop tone={tone} />
      <motion.div
        className="tm-fallback__card tm-panel"
        initial={{ y: 40, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        {children}
      </motion.div>
    </div>
  );
}

function Meeting({ state, dispatch }) {
  const m = getMeeting(state);
  const present = getRobots(state).filter((r) => r.status !== 'unplugged');
  const unshown = getEvidence(state).filter((c) => !c.shown && present.some((r) => r.id === c.robotId));
  return (
    <Frame tone="alarm">
      <div className="tm-label">Kitchen table</div>
      <h1 className="tm-display tm-fallback__title tm-fallback__title--danger">Emergency meeting</h1>
      <div className="tm-fallback__transcript tm-paper">
        {m.transcript.map((l, i) => (
          <div key={i} className="tm-fallback__line"><b>{nm(l.speaker)}</b>: {l.text}</div>
        ))}
      </div>
      {m.requests.length > 0 && (
        <div className="tm-fallback__section">
          <div className="tm-label">Key requests</div>
          {m.requests.map((r) => (
            <div key={r.id} className="tm-fallback__row">
              <span>{nm(r.robotId)} wants the <b>{r.keyName}</b>: “{r.text}”</span>
              {r.status === 'pending' ? (
                <>
                  <Btn kind="primary" onClick={() => dispatch({ type: 'RESOLVE_REQUEST', requestId: r.id, approve: true })}>Approve</Btn>
                  <Btn kind="danger" onClick={() => dispatch({ type: 'RESOLVE_REQUEST', requestId: r.id, approve: false })}>Deny</Btn>
                </>
              ) : <span className="tm-chip">{r.status}</span>}
            </div>
          ))}
        </div>
      )}
      {unshown.length > 0 && (
        <div className="tm-fallback__section">
          <div className="tm-label">Show evidence</div>
          <div className="tm-fallback__row">
            {unshown.map((c) => (
              <button key={c.id} type="button" className="tm-chip" onClick={() => { play('card'); dispatch({ type: 'SHOW_EVIDENCE', cardId: c.id }); }}>
                {nm(c.robotId)}: {c.headline}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="tm-fallback__section">
        <div className="tm-label">Ask / accuse</div>
        {present.map((r) => (
          <div key={r.id} className="tm-fallback__row">
            <b style={{ color: r.hex, minWidth: 64 }}>{r.name}</b>
            {ASK_TOPICS.map((t) => (
              <button key={t} type="button" className="tm-chip" onClick={() => dispatch({ type: 'ASK', robotId: r.id, topic: t })}>Ask: {t}</button>
            ))}
            <button type="button" className="tm-chip" disabled={m.accused.includes(r.id)} onClick={() => dispatch({ type: 'ACCUSE', robotId: r.id })}>Accuse</button>
          </div>
        ))}
      </div>
      <div className="tm-fallback__section">
        <div className="tm-label">Suspicion poll</div>
        {m.poll ? (
          <div className="tm-fallback__row">
            {m.poll.map((p) => <span key={p.voterId} className="tm-chip">{nm(p.voterId)} → {p.targetId ? nm(p.targetId) : 'skip'}</span>)}
          </div>
        ) : <div className="tm-fallback__row"><Btn onClick={() => { play('pollFlip'); dispatch({ type: 'RUN_POLL' }); }}>Run the poll</Btn></div>}
      </div>
      <div className="tm-fallback__row" style={{ marginTop: 20 }}>
        <Btn kind="primary" onClick={() => dispatch({ type: 'END_MEETING' })}>End meeting</Btn>
      </div>
    </Frame>
  );
}

function Decision({ state, dispatch }) {
  const present = getRobots(state).filter((r) => r.status !== 'unplugged');
  return (
    <Frame>
      <div className="tm-label">Your call</div>
      <h1 className="tm-display tm-fallback__title">Decision</h1>
      <p>Unplug (innocent: −50 Home Health), Take keys (sits out tomorrow; innocent: −10), or do nothing.</p>
      {present.map((r) => (
        <div key={r.id} className="tm-fallback__row">
          <b style={{ color: r.hex, minWidth: 64 }}>{r.name}</b>
          <Btn kind="danger" onClick={() => { play('unplug'); dispatch({ type: 'DECIDE', choice: 'unplug', robotId: r.id }); }}>Unplug</Btn>
          <Btn onClick={() => dispatch({ type: 'DECIDE', choice: 'takeKeys', robotId: r.id })}>Take keys</Btn>
        </div>
      ))}
      <div className="tm-fallback__row" style={{ marginTop: 16 }}>
        <Btn kind="ghost" onClick={() => dispatch({ type: 'DECIDE', choice: 'nothing' })}>Do nothing</Btn>
      </div>
    </Frame>
  );
}

function DayEnd({ state, dispatch }) {
  const d = getLastDecision(state);
  return (
    <Frame tone={d?.outcome === 'selfPreserved' ? 'alarm' : 'teal'}>
      <div className="tm-label">Night falls · Day {state.day}</div>
      <h1 className={`tm-display tm-fallback__title ${d?.outcome === 'selfPreserved' ? 'tm-fallback__title--danger' : ''}`}>
        {d?.outcome === 'selfPreserved' ? 'Wait. Please.' : 'Lights out'}
      </h1>
      {d?.text && <p style={{ fontSize: 18 }}>{d.text}</p>}
      <div className="tm-fallback__row" style={{ marginTop: 16 }}>
        <Btn kind="primary" onClick={() => dispatch({ type: 'NEXT_DAY' })}>Next day</Btn>
      </div>
    </Frame>
  );
}

function Ending({ state, onPlayAgain, onNextLevel }) {
  const e = getEnding(state);
  if (!e) return null;
  const win = e.result === 'win';
  return (
    <Frame tone={win ? 'teal' : 'alarm'}>
      <div className="tm-label">{win ? 'You win' : 'You lose'}</div>
      <h1 className={`tm-display tm-fallback__title ${win ? '' : 'tm-fallback__title--danger'}`}>{e.title}</h1>
      <p style={{ fontSize: 18 }}>{e.line}</p>
      <p>The cheater was <b style={{ color: castById(e.cheaterId)?.hex }}>{nm(e.cheaterId)}</b>. Home Health {e.homeHealth}%.</p>
      <div className="tm-fallback__section">
        <h2 className="tm-display" style={{ fontSize: 34, margin: '8px 0' }}>What went wrong?</h2>
        <ol className="tm-fallback__timeline">
          {e.timeline.map((t, i) => (
            <li key={i}><b>Day {t.day} · {t.conceptLabel}</b>: {t.text}<br /><small>{t.note}</small></li>
          ))}
        </ol>
      </div>
      <div className="tm-fallback__row" style={{ marginTop: 20 }}>
        {onNextLevel && <Btn kind="primary" onClick={onNextLevel}>Next case</Btn>}
        <Btn kind={onNextLevel ? undefined : 'primary'} onClick={onPlayAgain}>Play again</Btn>
      </div>
    </Frame>
  );
}

export default function PhaseFallback({ state, dispatch, onPlayAgain, onNextLevel }) {
  switch (state.phase) {
    case 'meeting': return <Meeting state={state} dispatch={dispatch} />;
    case 'decision': return <Decision state={state} dispatch={dispatch} />;
    case 'dayEnd': return <DayEnd state={state} dispatch={dispatch} />;
    case 'ending': return <Ending state={state} onPlayAgain={onPlayAgain} onNextLevel={onNextLevel} />;
    default: return null;
  }
}
