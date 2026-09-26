import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { B, Ball, Cyl } from './primitives.jsx';
import { mat } from './materials.js';

// Stand-in with the same props as W1's <Robot/> (see docs/CONTRACTS.md).
// ~1 unit tall, feet at y = 0, faces +Z.

const HEX = { BOLT: '#F5C518', MOCHI: '#FF8FB8', ZIGGY: '#4CC38A', PIP: '#4A90E2', JUNO: '#9B6BFF' };

export default function PlaceholderRobot({
  id = 'BOLT', pose = 'idle', expression = 'neutral', reveal = false,
  selected = false, dimmed = false, onClick, ...groupProps
}) {
  const body = useRef();
  const color = reveal ? '#ff3b3b' : HEX[id] ?? '#cccccc';
  const off = pose === 'off';
  useFrame(({ clock }) => {
    if (!body.current) return;
    const t = clock.elapsedTime + id.length;
    const g = body.current;
    g.position.y = pose === 'walk' ? Math.abs(Math.sin(t * 9)) * 0.06
      : pose === 'work' ? Math.abs(Math.sin(t * 4)) * 0.03
      : pose === 'celebrate' ? Math.abs(Math.sin(t * 6)) * 0.15 : 0;
    g.rotation.z = pose === 'walk' ? Math.sin(t * 9) * 0.06 : 0;
    g.rotation.x = off ? 0.25 : pose === 'sad' ? 0.18 : pose === 'work' ? 0.12 : 0;
  });
  const m = mat(off || dimmed ? '#6b7478' : color, { rough: 0.45 });
  const eye = mat(off ? '#333a3c' : '#ffffff', { rough: 0.3 });
  const sleepy = off || expression === 'sleepy';
  return (
    <group {...groupProps} onClick={onClick ? (e) => { e.stopPropagation(); onClick(e); } : undefined}>
      <group ref={body}>
        <Cyl r={0.08} h={0.18} at={[-0.13, 0, 0]} c="#2a2f31" />
        <Cyl r={0.08} h={0.18} at={[0.13, 0, 0]} c="#2a2f31" />
        <B s={[0.5, 0.42, 0.4]} at={[0, 0.16, 0]} m={m} r={0.14} />
        <B s={[0.62, 0.46, 0.5]} at={[0, 0.54, 0]} m={m} r={0.18} />
        <Ball sc={[0.1, sleepy ? 0.03 : 0.11, 0.04]} at={[-0.13, 0.78, 0.25]} m={eye} />
        <Ball sc={[0.1, sleepy ? 0.03 : 0.11, 0.04]} at={[0.13, 0.78, 0.25]} m={eye} />
        {!sleepy && <Ball r={0.04} at={[-0.13, 0.77, 0.285]} c="#111" shadow={false} />}
        {!sleepy && <Ball r={0.04} at={[0.13, 0.77, 0.285]} c="#111" shadow={false} />}
        <Cyl r={0.02} h={0.18} at={[0, 1.0, 0]} c="#2a2f31" />
        <Ball r={0.05} at={[0, 1.2, 0]} m={mat(color, { emissive: color, ei: off ? 0 : 1.2 })} />
      </group>
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[0.42, 0.5, 40]} />
          <meshBasicMaterial color="#3ee6e0" toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}
