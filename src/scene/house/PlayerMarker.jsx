import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { ROOMS_LAYOUT } from '../layout.js';
import { radialTexture } from './materials.js';

// "YOU" marker: a warm-white glowing floor ring + soft light beam + a YOU pill.
// Warm white = human; cyan is reserved for the AI / interactive glow.

const WARM = '#FFF1D6';

function beamTexture() {
  const cv = document.createElement('canvas');
  cv.width = 4; cv.height = 128;
  const g = cv.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 128);
  grd.addColorStop(0, 'rgba(255,255,255,0)');
  grd.addColorStop(1, 'rgba(255,255,255,0.9)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 4, 128);
  return new THREE.CanvasTexture(cv);
}

export function PlayerMarker({ playerRoom, anchors }) {
  const group = useRef();
  const ring = useRef();
  const ring2 = useRef();
  const target = playerRoom && ROOMS_LAYOUT[playerRoom] ? ROOMS_LAYOUT[playerRoom].player : null;
  const mats = useMemo(() => ({
    ring: new THREE.MeshBasicMaterial({ color: WARM, transparent: true, toneMapped: false, depthWrite: false }),
    pulse: new THREE.MeshBasicMaterial({ color: WARM, transparent: true, toneMapped: false, depthWrite: false }),
    disc: new THREE.MeshBasicMaterial({ map: radialTexture(), color: '#ffd9a0', transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
    beam: new THREE.MeshBasicMaterial({ map: beamTexture(), color: '#ffe7c0', transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }),
  }), []);
  const st = useRef({ x: 0, z: 0, init: false, vis: 0 });

  useFrame(({ clock }, dt) => {
    const g = group.current;
    if (!g) return;
    const s = st.current;
    if (target) {
      if (!s.init) { s.x = target[0]; s.z = target[1]; s.init = true; }
      const k = 1 - Math.exp(-dt * 5);
      s.x += (target[0] - s.x) * k;
      s.z += (target[1] - s.z) * k;
    }
    s.vis += ((target ? 1 : 0) - s.vis) * Math.min(1, dt * 6);
    g.visible = s.vis > 0.02;
    if (anchors) anchors.current.you = target ? [s.x, 1.7, s.z] : null;
    g.position.set(s.x, 0, s.z);
    g.scale.setScalar(0.6 + 0.4 * s.vis);
    const t = clock.elapsedTime;
    mats.ring.opacity = 0.95 * s.vis;
    const p = (t * 0.8) % 1;
    if (ring2.current) ring2.current.scale.setScalar(1 + p * 0.9);
    mats.pulse.opacity = (1 - p) * 0.7 * s.vis;
    if (ring.current) ring.current.rotation.z = t * 0.6;
    mats.beam.opacity = (0.28 + 0.07 * Math.sin(t * 2.2)) * s.vis;
  });

  return (
    <group ref={group} visible={false}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} material={mats.disc} renderOrder={3}>
        <planeGeometry args={[1.9, 1.9]} />
      </mesh>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]} material={mats.ring} renderOrder={4}>
        <ringGeometry args={[0.46, 0.56, 48, 1, 0, Math.PI * 1.7]} />
      </mesh>
      <mesh ref={ring2} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0]} material={mats.pulse} renderOrder={4}>
        <ringGeometry args={[0.5, 0.54, 48]} />
      </mesh>
      <mesh position={[0, 1.1, 0]} material={mats.beam} renderOrder={5}>
        <cylinderGeometry args={[0.42, 0.5, 2.2, 32, 1, true]} />
      </mesh>
    </group>
  );
}
