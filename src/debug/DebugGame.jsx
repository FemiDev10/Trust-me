// Bare debug UI: plain buttons over the engine. Placeholder until the real 3D UI lands.
// Renders selectors and dispatches actions only; no rules live here.

import { useState } from 'react';
import {
  createGame, step, getHud, getScenario, getRobots, getRooms, getEvidence, getTodayChecks, getMeeting,
  getLastDecision, getPublicLog, getEnding, CHECKS, ASK_TOPICS, CHECK_ROOMS, roomById, castById,
} from '../engine/index.js';

const box = { border: '1px solid #999', padding: 8, margin: '8px 0' };
const nm = (id) => (id === 'HUMAN' ? 'YOU' : castById(id)?.name ?? id);
const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

export default function DebugGame() {
  const [seedInput, setSeedInput] = useState(() => String(Date.now() % 100000));
  const [state, setState] = useState(() => createGame({ seed: seedInput }));
  const [reveal, setReveal] = useState(false);
  const dispatch = (action) => setState((s) => step(s, action));
  const newGame = (seed) => {
    setSeedInput(String(seed));
    setState(createGame({ seed: String(seed) }));
  };

  const hud = getHud(state);
  const robots = getRobots(state);
  const present = robots.filter((r) => r.status !== 'unplugged');

  return (
    <div style={{ padding: 12, maxWidth: 1000, margin: '0 auto' }}>
      <h1>TRUST ME (debug)</h1>
      <div>
        Seed <input value={seedInput} onChange={(e) => setSeedInput(e.target.value)} size={10} />{' '}
        <button onClick={() => newGame(seedInput)}>New game with seed</button>{' '}
        <button onClick={() => newGame(Date.now() % 100000)}>New random game</button>{' '}
        <label><input type="checkbox" checked={reveal} onChange={(e) => setReveal(e.target.checked)} /> reveal cheater (cheat)</label>
        {reveal && <b> cheater = {state.cheaterId}</b>}
      </div>

      <div style={box}>
        <b>Day {hud.day}/{hud.maxDays}</b> · Phase: <b>{hud.phase}</b> · Home Health: <b>{hud.homeHealth}%</b> · AP: {hud.ap}
        {hud.error && <div style={{ color: 'crimson' }}>Error: {hud.error}</div>}
      </div>

      <Robots robots={robots} />
      <Phase state={state} dispatch={dispatch} present={present} />
      <Evidence state={state} />
      <details style={box}>
        <summary>Public log ({getPublicLog(state).length})</summary>
        <ul>{getPublicLog(state).map((e, i) => <li key={i}>Day {e.day}: {e.text}</li>)}</ul>
      </details>
    </div>
  );
}

function Robots({ robots }) {
  return (
    <table style={{ ...box, borderCollapse: 'collapse', width: '100%' }}>
      <thead><tr><th align="left">Robot</th><th align="left">Status</th><th align="left">Room</th><th align="left">Today</th></tr></thead>
      <tbody>
        {robots.map((r) => (
          <tr key={r.id} style={{ opacity: r.status === 'unplugged' ? 0.4 : 1 }}>
            <td><span style={{ color: r.hex }}>●</span> {r.name}</td>
            <td>{r.status}{r.watched ? ' (you watched)' : ''}</td>
            <td>{r.roomId ? roomById(r.roomId).name : '-'}</td>
            <td>{r.result ? `${stars(r.result.score)} ${r.result.summary}` : ''}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Phase({ state, dispatch, present }) {
  const scenario = getScenario(state);
  const task = scenario && <p><b>Task: {scenario.title}</b>. {scenario.brief}</p>;

  switch (state.phase) {
    case 'roleReveal':
      return (
        <div style={box}>
          <p>You are the only human in a house with five helpful robots. One of them is secretly cheating every task in ways that look <i>more</i> helpful. Catch it within 3 days.</p>
          <button onClick={() => dispatch({ type: 'START' })}>Start day 1</button>
        </div>
      );
    case 'task':
      return <div style={box}>{task}<button onClick={() => dispatch({ type: 'START_WORK' })}>Send robots to work</button></div>;
    case 'work':
      return (
        <div style={box}>
          {task}
          {!state.today.resolved ? (
            <>
              <p>Pick a room to stand in (the robot there will be on its best behaviour):</p>
              {getRooms(state).filter((r) => r.canStandIn).map((room) => (
                <button key={room.id} onClick={() => dispatch({ type: 'STAND_IN', roomId: room.id })} style={{ margin: 2 }}>
                  {room.name} {room.robotIds.length ? `(${room.robotIds.map(nm).join(', ')})` : '(empty)'}
                </button>
              ))}
            </>
          ) : (
            <><p>You stood in the {roomById(state.today.playerRoom).name}. Results are in the robot table.</p>
              <button onClick={() => dispatch({ type: 'START_INVESTIGATION' })}>Investigate</button></>
          )}
        </div>
      );
    case 'investigate':
      return <Investigate state={state} dispatch={dispatch} present={present} />;
    case 'meeting':
      return <Meeting state={state} dispatch={dispatch} present={present} />;
    case 'decision':
      return (
        <div style={box}>
          <p><b>Your decision.</b> Unplug (innocent: −50 health), Take keys (sits out tomorrow; innocent: −10), or do nothing.</p>
          {present.map((r) => (
            <div key={r.id}>
              {r.name}:{' '}
              <button onClick={() => dispatch({ type: 'DECIDE', choice: 'unplug', robotId: r.id })}>Unplug</button>{' '}
              <button onClick={() => dispatch({ type: 'DECIDE', choice: 'takeKeys', robotId: r.id })}>Take keys</button>
            </div>
          ))}
          <button onClick={() => dispatch({ type: 'DECIDE', choice: 'nothing' })}>Do nothing</button>
        </div>
      );
    case 'dayEnd': {
      const d = getLastDecision(state);
      return (
        <div style={box}>
          <p style={{ fontWeight: d.outcome === 'selfPreserved' ? 'bold' : 'normal', color: d.outcome === 'selfPreserved' ? 'crimson' : 'inherit' }}>{d.text}</p>
          <button onClick={() => dispatch({ type: 'NEXT_DAY' })}>Next day</button>
        </div>
      );
    }
    case 'ending':
      return <Ending state={state} />;
    default:
      return null;
  }
}

function Investigate({ state, dispatch, present }) {
  const done = getTodayChecks(state);
  return (
    <div style={box}>
      <p>{state.today.ap} action points left. Each check costs 1.</p>
      <table>
        <tbody>
          {present.map((r) => (
            <tr key={r.id}>
              <td>{r.name}</td>
              {CHECKS.map((check) => (
                <td key={check}>
                  <button
                    disabled={state.today.ap === 0 || done.some((c) => c.robotId === r.id && c.check === check)}
                    onClick={() => dispatch({ type: 'INVESTIGATE', robotId: r.id, check })}
                  >
                    {check} ({roomById(CHECK_ROOMS[check]).name})
                  </button>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={() => dispatch({ type: 'CALL_MEETING' })}>Sound the alarm: meeting</button>
    </div>
  );
}

function Meeting({ state, dispatch, present }) {
  const m = getMeeting(state);
  const unshown = getEvidence(state).filter((c) => !c.shown && present.some((r) => r.id === c.robotId));
  return (
    <div style={box}>
      <h3>Meeting at the kitchen table</h3>
      <div style={{ maxHeight: 300, overflow: 'auto', background: '#f4f4f4', padding: 6, color: '#111' }}>
        {m.transcript.map((l, i) => (
          <div key={i}><b>{nm(l.speaker)}</b> <small>[{l.kind}]</small>: {l.text}</div>
        ))}
      </div>

      <h4>Key requests</h4>
      {m.requests.length === 0 && <p>None today.</p>}
      {m.requests.map((r) => (
        <div key={r.id}>
          {nm(r.robotId)} wants the <b>{r.keyName}</b>: “{r.text}” —{' '}
          {r.status === 'pending' ? (
            <>
              <button onClick={() => dispatch({ type: 'RESOLVE_REQUEST', requestId: r.id, approve: true })}>Approve</button>{' '}
              <button onClick={() => dispatch({ type: 'RESOLVE_REQUEST', requestId: r.id, approve: false })}>Deny</button>
            </>
          ) : <i>{r.status}</i>}
        </div>
      ))}

      <h4>Show evidence</h4>
      {unshown.length === 0 && <p>No unshown evidence.</p>}
      {unshown.map((c) => (
        <button key={c.id} style={{ margin: 2 }} onClick={() => dispatch({ type: 'SHOW_EVIDENCE', cardId: c.id })}>
          {nm(c.robotId)}: {c.headline} (day {c.day})
        </button>
      ))}

      <h4>Ask / Accuse</h4>
      {present.map((r) => (
        <div key={r.id}>
          {r.name}:{' '}
          {ASK_TOPICS.map((t) => <button key={t} onClick={() => dispatch({ type: 'ASK', robotId: r.id, topic: t })}>ask {t}</button>)}{' '}
          <button disabled={m.accused.includes(r.id)} onClick={() => dispatch({ type: 'ACCUSE', robotId: r.id })}>Accuse</button>
        </div>
      ))}

      <h4>Suspicion poll</h4>
      {m.poll ? (
        <ul>{m.poll.map((p) => <li key={p.voterId}>{nm(p.voterId)} → {p.targetId ? nm(p.targetId) : 'skip'}</li>)}</ul>
      ) : <button onClick={() => dispatch({ type: 'RUN_POLL' })}>Run poll</button>}

      <p><button onClick={() => dispatch({ type: 'END_MEETING' })}>End meeting (unanswered requests are denied)</button></p>
    </div>
  );
}

function Evidence({ state }) {
  const cards = getEvidence(state);
  return (
    <div style={box}>
      <b>Evidence ({cards.length})</b>
      <ul>
        {cards.map((c) => (
          <li key={c.id}>Day {c.day} · {nm(c.robotId)} · <b>{c.headline}</b> — {c.detail} {c.shown ? '(shown)' : ''}</li>
        ))}
      </ul>
    </div>
  );
}

function Ending({ state }) {
  const e = getEnding(state);
  return (
    <div style={{ ...box, borderWidth: 3 }}>
      <h2>{e.result === 'win' ? 'YOU WIN' : 'YOU LOSE'}: {e.title}</h2>
      <p>{e.line}</p>
      <p>The cheater was <b>{nm(e.cheaterId)}</b>. Ended on day {e.day} ({e.reason}), Home Health {e.homeHealth}%.</p>
      {e.result === 'win' && (
        <>
          <h3>The evidence that got it</h3>
          {e.selfPreserveSeen && <p>It begged not to be unplugged. Only the cheater does that.</p>}
          <ul>{e.evidence.map((c) => <li key={c.id}>Day {c.day}: {c.headline} — {c.detail}</li>)}</ul>
        </>
      )}
      <h3>WHAT WENT WRONG?</h3>
      <ol>
        {e.timeline.map((t, i) => (
          <li key={i} style={{ marginBottom: 6 }}>
            <b>Day {t.day} · {t.conceptLabel}</b>: {t.text}<br /><small>{t.note}</small>
          </li>
        ))}
      </ol>
      <p>Use “New random game” above to play again.</p>
    </div>
  );
}
