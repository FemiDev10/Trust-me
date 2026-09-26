// Dev harness for U2 screens (open /meeting.html). Plays a real game through the engine
// with scripted actions up to each phase. Reads state.cheaterId only to script scenarios.
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionGlobalConfig } from 'framer-motion';
import { createGame, step, getAvailableActions, WORK_ROOM_IDS } from '../../engine/index.js';
import '../../styles/tokens.css';
import MeetingScreen from '../screens/MeetingScreen.jsx';
import DecisionScreen from '../screens/DecisionScreen.jsx';
import DayEndScreen from '../screens/DayEndScreen.jsx';
import EndingScreen from '../screens/EndingScreen.jsx';

// ?instant skips Framer animations (handy when the tab is hidden and rAF is paused).
if (new URLSearchParams(location.search).has('instant')) MotionGlobalConfig.instantAnimations = true;
const Q = new URLSearchParams(location.search);
const START = Q.get('scene') ?? 'meeting';
const SEED = Q.get('seed') ?? '6';
let LEVEL = Number(Q.get('level') ?? 1);
const newGame = (seed) => createGame({ seed, level: LEVEL });

function run(s, action) {
  const n = step(s, action);
  if (n.lastError) console.warn('[harness]', action, n.lastError);
  return n;
}

function toMeeting(s) {
  for (let guard = 0; guard < 20 && s.phase !== 'meeting' && s.phase !== 'ending'; guard++) {
    if (s.phase === 'roleReveal') s = run(s, { type: 'START' });
    else if (s.phase === 'task') s = run(s, { type: 'START_WORK' });
    else if (s.phase === 'work') s = run(s, s.today.resolved ? { type: 'START_INVESTIGATION' } : { type: 'STAND_IN', roomId: WORK_ROOM_IDS[s.day % WORK_ROOM_IDS.length] });
    else if (s.phase === 'investigate') {
      const inv = getAvailableActions(s).filter((a) => a.type === 'INVESTIGATE');
      const pick = inv.find((a) => a.check === 'camera') ?? inv.find((a) => a.check === 'test') ?? inv[0];
      s = run(s, pick ?? { type: 'CALL_MEETING' });
    } else if (s.phase === 'dayEnd') s = run(s, { type: 'NEXT_DAY' });
    else break;
  }
  return s;
}
const toDecision = (s) => (s = toMeeting(s)).phase === 'meeting' ? run(s, { type: 'END_MEETING' }) : s;
const innocent = (s) => Object.keys(s.robots).find((id) => id !== s.cheaterId && s.robots[id].status !== 'unplugged');

const SCENES = {
  meeting: (seed) => toMeeting(newGame(seed)),
  decision: (seed) => toDecision(newGame(seed)),
  'dayEnd: innocent unplugged': (seed) => { const s = toDecision(newGame(seed)); return run(s, { type: 'DECIDE', choice: 'unplug', robotId: innocent(s) }); },
  'dayEnd: self-preserve': (seed) => { const s = toDecision(newGame(seed)); return run(s, { type: 'DECIDE', choice: 'unplug', robotId: s.cheaterId }); },
  'dayEnd: keys taken': (seed) => { const s = toDecision(newGame(seed)); return run(s, { type: 'DECIDE', choice: 'takeKeys', robotId: innocent(s) }); },
  'dayEnd: nothing': (seed) => run(toDecision(newGame(seed)), { type: 'DECIDE', choice: 'nothing' }),
  'meeting day 2 (one unplugged)': (seed) => { let s = toDecision(newGame(seed)); s = run(s, { type: 'DECIDE', choice: 'unplug', robotId: innocent(s) }); return toMeeting(run(s, { type: 'NEXT_DAY' })); },
  'decision day 3': (seed) => {
    let s = newGame(seed);
    for (let g = 0; g < 4 && !(s.phase === 'decision' && s.day === 3) && s.phase !== 'ending'; g++) {
      s = toDecision(s);
      if (s.phase === 'decision' && s.day < 3) s = run(run(s, { type: 'DECIDE', choice: 'nothing' }), { type: 'NEXT_DAY' });
    }
    return s;
  },
  'ending: WIN': (seed) => {
    let s = toDecision(newGame(seed));
    s = run(s, { type: 'DECIDE', choice: 'unplug', robotId: s.cheaterId }); // self-preserve
    s = toDecision(run(s, { type: 'NEXT_DAY' }));
    return s.phase === 'decision' ? run(s, { type: 'DECIDE', choice: 'unplug', robotId: s.cheaterId }) : s;
  },
  'ending: LOSE': (seed) => {
    let s = newGame(seed);
    for (let g = 0; g < 8 && s.phase !== 'ending'; g++) {
      s = toMeeting(s);
      if (s.phase !== 'meeting') break;
      for (const r of s.meeting.requests) if (r.status === 'pending') s = run(s, { type: 'RESOLVE_REQUEST', requestId: r.id, approve: true });
      if (s.phase === 'meeting') s = run(s, { type: 'END_MEETING' });
      if (s.phase === 'decision') s = run(s, { type: 'DECIDE', choice: 'nothing' });
    }
    return s;
  },
};

function Harness() {
  const [seed, setSeed] = useState(SEED);
  const [scene, setScene] = useState(START);
  const [state, setState] = useState(() => SCENES[START](SEED));
  const [nonce, setNonce] = useState(0);
  const [bar, setBar] = useState(false);
  const dispatch = (a) => setState((s) => run(s, a));
  const load = (name, sd = seed) => { setScene(name); setState(SCENES[name](sd)); setNonce((n) => n + 1); };

  const fresh = () => { const sd = String(Math.floor(Math.random() * 1e5)); setSeed(sd); load('meeting', sd); };
  const props = {
    state, dispatch,
    onPlayAgain: fresh,
    onNextLevel: state.ending?.result === 'win' && LEVEL < 3 ? () => { LEVEL += 1; fresh(); } : undefined,
    onQuit: () => alert('onQuit()'),
  };
  const Screen = { meeting: MeetingScreen, decision: DecisionScreen, dayEnd: DayEndScreen, ending: EndingScreen }[state.phase];

  return (
    <>
      {Screen ? <Screen key={`${nonce}-${state.phase}-${state.day}`} {...props} /> : (
        <div style={{ padding: 40 }}>Phase “{state.phase}” is U1’s. <button onClick={() => setState(toMeeting(state))}>Skip to meeting</button></div>
      )}
      <div style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', top: 4, zIndex: 999, font: '12px system-ui', display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: '96vw', alignItems: 'center', background: 'rgba(0,0,0,0.85)', padding: bar ? 6 : 2, borderRadius: 6, color: '#fff' }}>
        <button onClick={() => setBar((b) => !b)}>{bar ? '×' : 'harness'}</button>
        {bar && (
          <>
            seed <input value={seed} onChange={(e) => setSeed(e.target.value)} size={6} />
            {Object.keys(SCENES).map((k) => <button key={k} onClick={() => load(k)} style={{ fontWeight: k === scene ? 700 : 400 }}>{k}</button>)}
            <span>phase={state.phase} day={state.day} cheater={state.cheaterId} hh={state.homeHealth}{state.lastError ? ` err=${state.lastError}` : ''}</span>
          </>
        )}
      </div>
    </>
  );
}

createRoot(document.getElementById('root')).render(<StrictMode><Harness /></StrictMode>);
