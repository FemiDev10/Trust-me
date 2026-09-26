// Test harness for <HouseScene/>: open /scene.html in the Vite dev server.
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import HouseScene from '../HouseScene.jsx';
import { ROOMS, WORK_ROOM_IDS } from '../../engine/data/rooms.js';
import { CAST } from '../../engine/data/cast.js';
import '../../styles/tokens.css';

// ?all=<roomId> starts every robot in one room (handy for checking slot spacing); ?all= (empty) = no room
const ALL = new URLSearchParams(location.search).get('all');
const START = ALL !== null
  ? (ALL ? Object.fromEntries(CAST.map((c) => [c.id, ALL])) : {})
  : { BOLT: 'kitchen', MOCHI: 'living', ZIGGY: 'garage', PIP: 'security', JUNO: 'garden' };
const MOODS = ['day', 'night', 'alarm', 'takeover'];
const STATUSES = ['active', 'sittingOut', 'unplugged'];

const bar = { display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' };
const btn = (on) => ({
  font: '700 12px "Barlow Condensed", sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase',
  padding: '5px 9px', borderRadius: 6, cursor: 'pointer',
  border: '1.5px solid ' + (on ? '#3ee6e0' : 'rgba(160,240,235,.25)'),
  background: on ? '#3ee6e0' : 'rgba(3,16,18,.85)', color: on ? '#031012' : '#f3fbfa',
});

function Harness() {
  const [rooms, setRooms] = useState(START);
  const [status, setStatus] = useState({});
  const [mood, setMood] = useState('night');
  const [playerRoom, setPlayerRoom] = useState('kitchen');
  const [focus, setFocus] = useState(null);
  const [allActive, setAllActive] = useState(true);
  const [selRobot, setSelRobot] = useState('BOLT');
  const [log, setLog] = useState('');
  const [gather, setGather] = useState(false);

  const robots = CAST.map((c) => ({ id: c.id, name: c.name, hex: c.hex, status: status[c.id] ?? 'active', roomId: rooms[c.id] }));
  const active = allActive ? WORK_ROOM_IDS : [];
  const randomise = () => {
    const next = {};
    CAST.forEach((c) => { next[c.id] = WORK_ROOM_IDS[Math.floor(Math.random() * WORK_ROOM_IDS.length)]; });
    setRooms(next);
  };

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <HouseScene
        robots={robots}
        playerRoom={playerRoom}
        activeRoomIds={active}
        onRoomClick={(id) => { setPlayerRoom(id); setLog(`onRoomClick(${id})`); }}
        focusRobotId={focus}
        mood={mood}
        onRobotClick={(id) => setLog(`onRobotClick(${id})`)}
        insets={{ top: 90, bottom: 10 }}
        gatherAtTable={gather}
      />
      <div style={{ position: 'absolute', top: 8, left: 8, right: 8, display: 'grid', gap: 6, zIndex: 50, pointerEvents: 'none' }}>
        <div style={{ ...bar, pointerEvents: 'auto' }}>
          {MOODS.map((m) => <button key={m} style={btn(mood === m)} onClick={() => setMood(m)}>{m}</button>)}
          <span style={{ width: 12 }} />
          <button style={btn(allActive)} onClick={() => setAllActive((v) => !v)}>active rooms</button>
          <button style={btn(false)} onClick={randomise}>shuffle robots</button>
          <button style={btn(false)} onClick={() => { setRooms({}); }}>all → kitchen (no room)</button>
          <button style={btn(false)} onClick={() => setPlayerRoom(null)}>no player</button>
          <button style={btn(gather)} onClick={() => setGather((g) => !g)}>gather at table (task)</button>
          <span style={{ color: '#3ee6e0', font: '600 12px monospace' }}>{log}</span>
        </div>
        <div style={{ ...bar, pointerEvents: 'auto' }}>
          {CAST.map((c) => (
            <button key={c.id} style={{ ...btn(selRobot === c.id), borderColor: c.hex }} onClick={() => setSelRobot(c.id)}>{c.id}</button>
          ))}
          <span style={{ color: '#a9c9c6', font: '600 12px sans-serif' }}>→</span>
          {ROOMS.map((r) => (
            <button key={r.id} style={btn(rooms[selRobot] === r.id)} onClick={() => setRooms((x) => ({ ...x, [selRobot]: r.id }))}>{r.id}</button>
          ))}
          {STATUSES.map((s) => (
            <button key={s} style={btn((status[selRobot] ?? 'active') === s)} onClick={() => setStatus((x) => ({ ...x, [selRobot]: s }))}>{s}</button>
          ))}
          <button style={btn(focus === selRobot)} onClick={() => setFocus((f) => (f === selRobot ? null : selRobot))}>focus</button>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<StrictMode><Harness /></StrictMode>);
