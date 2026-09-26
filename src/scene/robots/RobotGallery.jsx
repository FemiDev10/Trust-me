// Test harness for the robot cast: all 5 robots side by side, with pose/expression/reveal controls
// and a row of RobotPortraits. Rendered by gallery.html (not part of the game).
import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import Robot, { RobotPortrait, ROBOT_IDS, ROBOT_COLORS } from './Robot.jsx';

const POSES = ['idle', 'walk', 'work', 'talk', 'sad', 'off', 'celebrate'];
const EXPRESSIONS = ['neutral', 'happy', 'worried', 'smug', 'angry', 'sleepy'];

const btn = (active, color = '#3EE6E0') => ({
  font: '600 13px/1 system-ui, sans-serif',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  padding: '8px 12px',
  borderRadius: 999,
  border: `2px solid ${active ? color : '#1d4a4f'}`,
  background: active ? color : 'transparent',
  color: active ? '#03181B' : '#cfe9e8',
  cursor: 'pointer',
});

const Q = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();

export default function RobotGallery() {
  if (Q.has('sheet')) return <Sheet />;
  return <Gallery />;
}

// ?sheet&pose=talk&expression=smug&reveal=PIP : big portraits of the whole cast, for review screenshots.
function Sheet() {
  const pose = Q.get('pose') || 'idle';
  const expression = Q.get('expression') || 'neutral';
  const size = Number(Q.get('size') || 300);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: 16, background: '#062A2E', minHeight: '100vh' }}>
      {ROBOT_IDS.map((id) => (
        <RobotPortrait key={id} id={id} pose={pose} expression={expression} reveal={Q.get('reveal') === id} size={size} />
      ))}
    </div>
  );
}

function Gallery() {
  const [pose, setPose] = useState(Q.get('pose') || 'idle');
  const [expression, setExpression] = useState(Q.get('expression') || 'neutral');
  const [revealId, setRevealId] = useState(Q.get('reveal'));
  const [selectedId, setSelectedId] = useState(Q.get('selected') || 'MOCHI');
  const [dimOthers, setDimOthers] = useState(Q.has('dim'));
  const [perRobot, setPerRobot] = useState(false);

  // "mixed" mode gives each robot a different pose/expression for a quick overview.
  const look = (i) =>
    perRobot
      ? { pose: POSES[(i + 1) % POSES.length], expression: EXPRESSIONS[(i + 1) % EXPRESSIONS.length] }
      : { pose, expression };

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 50% 30%, #0B3A3F 0%, #062A2E 45%, #03181B 100%)', color: '#cfe9e8', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ height: '58vh', minHeight: 380 }}>
        <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 1.6, 5.2], fov: 38 }}>
          <color attach="background" args={['#062A2E']} />
          <fog attach="fog" args={['#062A2E', 7, 14]} />
          <ambientLight intensity={0.4} color="#bfe9ea" />
          <hemisphereLight args={['#fff1dc', '#0b3a3f', 0.6]} />
          <directionalLight position={[3, 5, 4]} intensity={2.2} color="#fff3e2" castShadow shadow-mapSize={[1024, 1024]} />
          <directionalLight position={[-4, 2, -3]} intensity={1.4} color="#3EE6E0" />
          {ROBOT_IDS.map((id, i) => (
            <Robot
              key={id}
              id={id}
              {...look(i)}
              reveal={revealId === id}
              selected={selectedId === id}
              dimmed={dimOthers && selectedId !== id}
              onClick={() => setSelectedId(id)}
              position={[(i - 2) * 1.15, 0, 0]}
            />
          ))}
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[6, 64]} />
            <meshStandardMaterial color="#0B3A3F" roughness={0.9} />
          </mesh>
          <ContactShadows position={[0, 0.002, 0]} opacity={0.55} scale={10} blur={2.4} far={2} />
          <OrbitControls target={[0, 0.5, 0]} enablePan={false} />
        </Canvas>
      </div>

      <div style={{ padding: '16px 24px', display: 'grid', gap: 12 }}>
        <Row label="Pose">
          {POSES.map((p) => (
            <button key={p} style={btn(!perRobot && pose === p)} onClick={() => { setPerRobot(false); setPose(p); }}>{p}</button>
          ))}
          <button style={btn(perRobot, '#F5C518')} onClick={() => setPerRobot((v) => !v)}>mixed</button>
        </Row>
        <Row label="Expression">
          {EXPRESSIONS.map((e) => (
            <button key={e} style={btn(!perRobot && expression === e)} onClick={() => { setPerRobot(false); setExpression(e); }}>{e}</button>
          ))}
        </Row>
        <Row label="Reveal">
          <button style={btn(revealId === null, '#FF3B3B')} onClick={() => setRevealId(null)}>none</button>
          {ROBOT_IDS.map((id) => (
            <button key={id} style={btn(revealId === id, '#FF3B3B')} onClick={() => setRevealId(id)}>{id}</button>
          ))}
        </Row>
        <Row label="Select">
          {ROBOT_IDS.map((id) => (
            <button key={id} style={btn(selectedId === id, ROBOT_COLORS[id])} onClick={() => setSelectedId(id)}>{id}</button>
          ))}
          <button style={btn(dimOthers)} onClick={() => setDimOthers((v) => !v)}>dim others</button>
        </Row>
        <Row label="Portraits">
          {ROBOT_IDS.map((id, i) => (
            <div key={id} style={{ textAlign: 'center' }}>
              <RobotPortrait id={id} {...look(i)} reveal={revealId === id} size={132} />
              <div style={{ font: '700 12px system-ui', letterSpacing: '0.1em', color: ROBOT_COLORS[id] }}>{id}</div>
            </div>
          ))}
          <div style={{ textAlign: 'center' }}>
            <RobotPortrait id="PIP" pose="talk" expression="smug" size={48} />
            <div style={{ font: '700 11px system-ui', opacity: 0.7 }}>48px</div>
          </div>
        </Row>
        <Row label="Close-up">
          <RobotPortrait id={selectedId} pose={pose} expression={expression} reveal={revealId === selectedId} size={300} />
        </Row>
      </div>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <div style={{ width: 96, font: '700 11px system-ui', letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.6 }}>{label}</div>
      {children}
    </div>
  );
}
