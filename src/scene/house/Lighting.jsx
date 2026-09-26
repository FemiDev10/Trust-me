import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, Sparkles } from '@react-three/drei';
import { MOOD_MATS, radialTexture } from './materials.js';

// Mood presets. Everything lerps toward the active preset each frame, so mood
// changes are smooth cross-fades (alarm pulses, takeover flickers).

const PRESETS = {
  day: {
    bg: '#0a3a3f', hemiSky: '#e8f4ff', hemiGround: '#6b5238', hemi: 1.05,
    key: '#ffe2bd', keyI: 2.3, rim: '#8fe3ff', rimI: 0.5,
    pool: '#ffb45a', poolO: 0.22, lamp: '#ffb866', lampI: 3,
    screen: '#3ee6e0', screenAlt: '#5be38c', screenI: 1.2, bulb: '#ffc070',
    red: 0, env: 0.55, sparkle: '#9ff5ee',
  },
  night: {
    bg: '#041d21', hemiSky: '#4f7fa8', hemiGround: '#1b1410', hemi: 0.42,
    key: '#a9c2ff', keyI: 0.75, rim: '#3ee6e0', rimI: 0.9,
    pool: '#ffa347', poolO: 0.55, lamp: '#ffa347', lampI: 9,
    screen: '#3ee6e0', screenAlt: '#5be38c', screenI: 2.0, bulb: '#ffb055',
    red: 0, env: 0.3, sparkle: '#3ee6e0',
  },
  alarm: {
    bg: '#1a0709', hemiSky: '#6a3036', hemiGround: '#140606', hemi: 0.45,
    key: '#ffb0a0', keyI: 0.7, rim: '#ff3b3b', rimI: 0.8,
    pool: '#ff6a4a', poolO: 0.35, lamp: '#ff7a55', lampI: 5,
    screen: '#ff3b3b', screenAlt: '#ff3b3b', screenI: 2.2, bulb: '#ff6a4a',
    red: 1, env: 0.3, sparkle: '#ff6b6b',
  },
  takeover: {
    bg: '#200406', hemiSky: '#ff2a2a', hemiGround: '#1a0000', hemi: 0.55,
    key: '#ff4040', keyI: 1.0, rim: '#ff1f1f', rimI: 1.2,
    pool: '#ff2020', poolO: 0.5, lamp: '#ff2020', lampI: 7,
    screen: '#ff1f1f', screenAlt: '#ff1f1f', screenI: 2.6, bulb: '#ff2020',
    red: 0.6, env: 0.2, sparkle: '#ff3b3b',
  },
};

// Warm light pools painted onto floors (cheap additive quads) + a few real lamps.
const POOLS = [
  [-2.4, -3.9, 4.2], [-3.3, -6.0, 2.4], [5.5, -4.5, 4.4], [2.1, -6.2, 2.2], [-11.6, -2.5, 4.0], [-7.2, -3.8, 3],
  [-7.3, 2.2, 3.2], [-2.8, 1.8, 3], [1.4, 3.6, 3.6], [6.4, 3.8, 3.8], [0, 0, 3], [-5, 0, 3], [5, 0, 3],
];
const LAMPS = [[-2.4, 2.2, -3.9], [5.5, 2.2, -4.3], [1.4, 2.0, 3.4], [6.4, 2.0, 3.9], [-11.6, 2.4, -2.5]];

const tmp = new THREE.Color();
const lerpC = (c, hex, k) => c.lerp(tmp.set(hex), k);

export function Lighting({ mood = 'night', center = [0, 0, 0] }) {
  const scene = useThree((s) => s.scene);
  const hemi = useRef(), key = useRef(), rim = useRef(), red = useRef();
  const lamps = useRef([]);
  const poolMat = useMemo(() => new THREE.MeshBasicMaterial({
    map: radialTexture(), color: '#ffb45a', transparent: true, opacity: 0.3,
    blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
  }), []);
  const state = useRef({ flicker: 1, nextFlicker: 0 });

  useFrame(({ clock }, dt) => {
    const P = PRESETS[mood] ?? PRESETS.night;
    const k = 1 - Math.exp(-dt * 3.2);
    const t = clock.elapsedTime;
    if (!scene.background || !scene.background.isColor) scene.background = new THREE.Color(P.bg);
    lerpC(scene.background, P.bg, k);
    scene.environmentIntensity = THREE.MathUtils.lerp(scene.environmentIntensity ?? 1, P.env, k);

    // takeover flicker: random brief dips
    const st = state.current;
    if (mood === 'takeover') {
      if (t > st.nextFlicker) { st.flicker = 0.15 + Math.random() * 0.5; st.nextFlicker = t + 0.05 + Math.random() * 0.5; }
      else st.flicker += (1 - st.flicker) * Math.min(1, dt * 12);
    } else st.flicker = 1;
    const f = st.flicker;

    if (hemi.current) {
      lerpC(hemi.current.color, P.hemiSky, k);
      lerpC(hemi.current.groundColor, P.hemiGround, k);
      hemi.current.intensity = THREE.MathUtils.lerp(hemi.current.intensity, P.hemi * f, k * 2);
    }
    if (key.current) {
      lerpC(key.current.color, P.key, k);
      key.current.intensity = THREE.MathUtils.lerp(key.current.intensity, P.keyI * f, k * 2);
    }
    if (rim.current) {
      lerpC(rim.current.color, P.rim, k);
      rim.current.intensity = THREE.MathUtils.lerp(rim.current.intensity, P.rimI, k);
    }
    lamps.current.forEach((l, i) => {
      if (!l) return;
      lerpC(l.color, P.lamp, k);
      const wobble = mood === 'takeover' ? f * (0.7 + 0.3 * Math.sin(t * 17 + i * 3)) : 1;
      l.intensity = THREE.MathUtils.lerp(l.intensity, P.lampI * wobble, k * 2);
    });
    // alarm: pulsing red wash from above
    if (red.current) {
      const pulse = mood === 'alarm' ? 0.5 + 0.5 * Math.sin(t * 5.2) : mood === 'takeover' ? 0.7 * f : 0;
      red.current.intensity = THREE.MathUtils.lerp(red.current.intensity, P.red * pulse * 3.2, Math.min(1, dt * 10));
    }
    lerpC(poolMat.color, P.pool, k);
    poolMat.opacity = THREE.MathUtils.lerp(poolMat.opacity, P.poolO * (mood === 'takeover' ? f : 1), k * 2);

    lerpC(MOOD_MATS.screen.emissive, P.screen, k);
    lerpC(MOOD_MATS.screenAlt.emissive, P.screenAlt, k);
    MOOD_MATS.screen.emissiveIntensity = MOOD_MATS.screenAlt.emissiveIntensity = P.screenI * (mood === 'takeover' ? f : 1);
    lerpC(MOOD_MATS.bulb.emissive, P.bulb, k);
  });

  const [cx, , cz] = center;
  return (
    <>
      <hemisphereLight ref={hemi} intensity={0.5} color="#4f7fa8" groundColor="#1b1410" />
      <directionalLight
        ref={key}
        position={[cx - 9, 20, cz + 12]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
        shadow-camera-near={1}
        shadow-camera-far={60}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-radius={4}
      >
        <object3D attach="target" position={[cx, 0, cz]} />
      </directionalLight>
      <directionalLight ref={rim} position={[cx + 14, 8, cz - 16]} intensity={0.6}>
        <object3D attach="target" position={[cx, 0, cz]} />
      </directionalLight>
      <pointLight ref={red} position={[cx, 9, cz]} color="#ff2a2a" intensity={0} distance={40} decay={0.6} />
      {LAMPS.map((p, i) => (
        <pointLight key={i} ref={(el) => { lamps.current[i] = el; }} position={p} intensity={0} distance={7.5} decay={1.6} />
      ))}
      {POOLS.map(([x, z, r], i) => (
        <mesh key={i} position={[x, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]} material={poolMat} renderOrder={1}>
          <planeGeometry args={[r, r]} />
        </mesh>
      ))}
      <Environment resolution={64} frames={1}>
        <Lightformer form="rect" intensity={2.2} color="#fff2dc" position={[0, 6, 4]} scale={[10, 4, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#3ee6e0" position={[-8, 3, -6]} scale={[6, 3, 1]} />
        <Lightformer form="circle" intensity={1.4} color="#ffb45a" position={[8, 4, 6]} scale={3} />
      </Environment>
      <Sparkles count={70} scale={[46, 12, 30]} position={[cx, 3, cz]} size={2.2} speed={0.25} opacity={0.5} color={(PRESETS[mood] ?? PRESETS.night).sparkle} noise={0.6} />
    </>
  );
}

export const MOOD_BG = Object.fromEntries(Object.entries(PRESETS).map(([k, v]) => [k, v.bg]));
