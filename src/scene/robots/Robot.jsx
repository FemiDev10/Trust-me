// TRUST ME: the robot cast. Procedural designer-vinyl-toy robots.
//
// <Robot id pose expression reveal selected dimmed onClick {...groupProps} />
// <RobotPortrait id pose expression reveal size />
//
// All geometry is cached and shared (geometry.js). Materials are per instance (they carry
// per-robot state: desaturation, reveal red, dimming) and are disposed on unmount.
// useFrame does no allocations: every channel is a plain number damped towards a target.
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import * as g from './geometry.js';
import { ROBOT_SPECS } from './robotSpecs.jsx';

export { ROBOT_SPECS, ROBOT_IDS, ROBOT_COLORS } from './robotSpecs.jsx';

const RED = new THREE.Color('#FF3B3B');
const CREAM = new THREE.Color('#FFF4E0');
const EYE_WHITE = new THREE.Color('#FFFDF7');
const EYE_OFF = new THREE.Color('#6E7479');
const EYE_REVEAL = new THREE.Color('#FFE3E3');
const BLACK = new THREE.Color('#000000');
const SCREEN = new THREE.Color('#0A1B2B');
const GLOW_FACE = new THREE.Color('#D9F1FF');

// Shared (state-less) materials.
const INK = new THREE.MeshStandardMaterial({ color: '#141821', roughness: 0.55 });
const GRAPHITE = new THREE.MeshPhysicalMaterial({
  color: '#2B3140',
  roughness: 0.45,
  clearcoat: 0.3,
  clearcoatRoughness: 0.4,
});
const HIGHLIGHT = new THREE.MeshBasicMaterial({ color: '#ffffff' });

const POSES = ['idle', 'walk', 'work', 'talk', 'sad', 'off', 'celebrate'];

// Eye acting. uL/lL: upper/lower lid closure (0 open, 1 shut). lT: lid tilt (+ = inner corner down).
// bY: brow lift (in eye radii), bT: brow tilt (+ = angry V), bA*: right-brow asymmetry.
// pS: pupil scale, pX/pY: pupil offset bias, eS: eye plate scale, m: mouth curve (+ smile), mT: mouth tilt.
const EXPRESSIONS = {
  neutral: { uL: 0.1, lL: 0.0, lT: 0.0, bY: 0.0, bT: 0.0, bAY: 0, bAT: 0, pS: 1.0, pX: 0, pY: 0, eS: 1.0, m: 0.25, mT: 0 },
  happy: { uL: 0.0, lL: 0.44, lT: -0.05, bY: 0.3, bT: -0.2, bAY: 0, bAT: 0, pS: 1.12, pX: 0, pY: 0.08, eS: 1.04, m: 1.0, mT: 0 },
  worried: { uL: 0.12, lL: 0.0, lT: -0.4, bY: 0.28, bT: -0.5, bAY: 0, bAT: 0, pS: 0.72, pX: 0, pY: -0.05, eS: 1.1, m: -0.55, mT: 0.1 },
  smug: { uL: 0.46, lL: 0.2, lT: 0.08, bY: 0.02, bT: 0.12, bAY: 0.28, bAT: -0.45, pS: 0.9, pX: 0.32, pY: 0.02, eS: 0.98, m: 0.55, mT: 0.5 },
  angry: { uL: 0.34, lL: 0.08, lT: 0.5, bY: -0.12, bT: 0.55, bAY: 0, bAT: 0, pS: 0.66, pX: 0, pY: 0, eS: 1.0, m: -0.45, mT: 0 },
  sleepy: { uL: 0.64, lL: 0.14, lT: -0.12, bY: -0.12, bT: -0.12, bAY: 0, bAT: 0, pS: 0.92, pX: 0, pY: -0.2, eS: 0.98, m: 0.05, mT: 0 },
};
const EXPR_KEYS = Object.keys(EXPRESSIONS.neutral);

const damp = THREE.MathUtils.damp;
const clamp = THREE.MathUtils.clamp;

function hashId(id) {
  let h = 7;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 1000;
  return h / 1000;
}

function useRobotMaterials(spec) {
  const mats = useMemo(() => {
    const base = new THREE.Color(spec.color);
    const trimBase = base.clone().lerp(CREAM, spec.trimMix ?? 0.5);
    const lum = (c) => c.r * 0.2126 + c.g * 0.7152 + c.b * 0.0722;
    const grey = new THREE.Color().setRGB(lum(base) * 0.8, lum(base) * 0.8, lum(base) * 0.85);
    const trimGrey = new THREE.Color().setRGB(lum(trimBase) * 0.8, lum(trimBase) * 0.8, lum(trimBase) * 0.85);

    const vinyl = {
      roughness: 0.42,
      metalness: 0.0,
      clearcoat: 0.45,
      clearcoatRoughness: 0.32,
      sheen: 0.25,
      sheenRoughness: 0.6,
    };
    const body = new THREE.MeshPhysicalMaterial({ color: base.clone(), ...vinyl, sheenColor: base.clone() });
    const trim = new THREE.MeshPhysicalMaterial({ color: trimBase.clone(), ...vinyl });
    const seam = new THREE.MeshStandardMaterial({
      color: base.clone(),
      emissive: base.clone(),
      emissiveIntensity: 1.6,
      roughness: 0.3,
    });
    const eye = new THREE.MeshPhysicalMaterial({
      color: EYE_WHITE.clone(),
      roughness: 0.22,
      clearcoat: 1,
      clearcoatRoughness: 0.15,
      emissive: spec.face === 'glow' ? GLOW_FACE.clone() : EYE_WHITE.clone(),
      emissiveIntensity: spec.face === 'glow' ? 0.9 : 0.12,
    });
    const pupil = new THREE.MeshPhysicalMaterial({
      color: '#10131A',
      roughness: 0.18,
      clearcoat: 1,
      emissive: BLACK.clone(),
      emissiveIntensity: 1,
    });
    const screen = spec.lid === 'screen'
      ? new THREE.MeshPhysicalMaterial({
          color: SCREEN.clone(),
          roughness: 0.15,
          clearcoat: 1,
          clearcoatRoughness: 0.05,
          emissive: new THREE.Color('#0E3A5C'),
          emissiveIntensity: 0.6,
          side: THREE.DoubleSide,
        })
      : null;
    const lid = screen || new THREE.MeshPhysicalMaterial({ color: base.clone(), ...vinyl, side: THREE.DoubleSide });
    const ringMat = new THREE.MeshBasicMaterial({
      color: base.clone(),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      toneMapped: false,
    });
    const discMat = ringMat.clone();

    return {
      body,
      trim,
      seam,
      eye,
      pupil,
      lid,
      screen,
      ringMat,
      discMat,
      ink: INK,
      graphite: GRAPHITE,
      face: spec.face === 'glow' ? eye : INK,
      outline: screen || INK,
      mouthInner: spec.face === 'glow' ? eye : INK,
      // colour sources for per-frame blending
      _base: base,
      _grey: grey,
      _trimBase: trimBase,
      _trimGrey: trimGrey,
    };
  }, [spec]);

  useEffect(
    () => () => {
      for (const k of ['body', 'trim', 'seam', 'eye', 'pupil', 'lid', 'screen', 'ringMat', 'discMat']) {
        if (mats[k] && mats[k] !== INK && mats[k] !== GRAPHITE) mats[k].dispose();
      }
    },
    [mats],
  );
  return mats;
}

// -------------------------------------------------------------------------- Eye
function Eye({ side, spec, mats, store }) {
  const e = spec.eye;
  const r = e.r;
  const o = store;
  const bl = spec.brow;
  return (
    <>
      <group position={[side * e.x, e.y, e.z]} rotation={[0, side * e.rotY, 0]}>
        <group ref={(el) => (o.g = el)} scale={[1, 1, e.flat]}>
          <mesh geometry={g.sphere()} material={mats.outline} position={[0, 0, -0.3 * r]} scale={1.24 * r} />
          <mesh geometry={g.sphere()} material={mats.eye} scale={r} />
          <group ref={(el) => (o.p = el)}>
            <mesh ref={(el) => (o.pm = el)} geometry={g.capZ(0.44)} material={spec.face === 'glow' ? mats.outline : mats.pupil} scale={1.006 * r} />
            {spec.face !== 'glow' && (
              <group rotation={[-0.2, 0.17, 0]}>
                <mesh geometry={g.capZ(0.1)} material={HIGHLIGHT} scale={1.014 * r} />
              </group>
            )}
          </group>
          <group ref={(el) => (o.lt = el)}>
            <mesh ref={(el) => (o.lu = el)} geometry={g.hemiUp()} material={mats.lid} scale={1.06 * r} rotation={[-1.45, 0, 0]} visible={false} />
            <mesh ref={(el) => (o.ll = el)} geometry={g.hemiDown()} material={mats.lid} scale={1.06 * r} rotation={[1.45, 0, 0]} visible={false} />
          </group>
        </group>
      </group>
      {bl && (
        <group ref={(el) => (o.b = el)} position={[side * e.x, e.y + r * 1.5, bl.z]}>
          <mesh
            geometry={g.capsule(0.16, 1)}
            material={mats.face}
            rotation={[0, 0, Math.PI / 2]}
            scale={[r * 0.75, r * bl.len * 0.75, r * 0.6]}
          />
        </group>
      )}
    </>
  );
}

// ------------------------------------------------------------------------ Mouth
// A curved ink stroke made of overlapping pills, re-laid each frame from a curvature value,
// plus an open "mouth" ellipse for talking.
const MOUTH_N = 7;
function Mouth({ spec, mats, store }) {
  const mo = spec.mouth;
  store.segs = store.segs || [];
  return (
    <group position={[0, mo.y, mo.z]}>
      {Array.from({ length: MOUTH_N }, (_, i) => (
        <mesh key={i} ref={(el) => (store.segs[i] = el)} geometry={g.sphereLo()} material={mats.face} scale={0.001} />
      ))}
      <mesh ref={(el) => (store.open = el)} geometry={g.sphere()} material={mats.mouthInner} position={[0, -0.012, -0.004]} scale={[0.001, 0.001, 0.001]} />
    </group>
  );
}

// ------------------------------------------------------------------------ Robot
export default function Robot({
  id = 'BOLT',
  pose = 'idle',
  expression = 'neutral',
  reveal = false,
  selected = false,
  dimmed = false,
  onClick,
  children,
  ...groupProps
}) {
  const spec = ROBOT_SPECS[id] || ROBOT_SPECS.BOLT;
  const mats = useRobotMaterials(spec);

  const root = useRef();
  const body = useRef();
  const torso = useRef();
  const head = useRef();
  const armL = useRef();
  const armR = useRef();
  const legL = useRef();
  const legR = useRef();
  const ring = useRef();
  const eyes = useRef([{}, {}]).current;
  const mouth = useRef({}).current;
  const extras = useRef({}).current;

  // All animation state lives here: no allocations per frame.
  const st = useRef(null);
  if (!st.current) {
    const seed = hashId(spec.name);
    const w = {};
    for (const p of POSES) w[p] = p === pose ? 1 : 0;
    const ex = { ...EXPRESSIONS[expression] || EXPRESSIONS.neutral };
    st.current = {
      seed,
      w,
      ex,
      power: pose === 'off' ? 0 : 1,
      rev: reveal ? 1 : 0,
      dim: dimmed ? 1 : 0,
      sel: selected ? 1 : 0,
      blinkAt: 1 + seed * 3,
      blink: -10,
      lookAt: 0.5,
      lookX: 0,
      lookY: 0,
      pX: 0,
      pY: 0,
      glitchUntil: 0,
      glitchNext: 0.6,
      talkEnv: 0,
    };
  }
  // Latest props, read inside useFrame.
  const props = useRef({});
  props.current.pose = POSES.includes(pose) ? pose : 'idle';
  props.current.expression = EXPRESSIONS[expression] ? expression : 'neutral';
  props.current.reveal = !!reveal;
  props.current.selected = !!selected;
  props.current.dimmed = !!dimmed;

  useFrame((state, rawDt) => {
    const s = st.current;
    const P = props.current;
    const dt = Math.min(rawDt, 0.05);
    const t = state.clock.elapsedTime + s.seed * 10;

    // ---- blend weights
    const w = s.w;
    for (let i = 0; i < POSES.length; i++) {
      const k = POSES[i];
      w[k] = damp(w[k], k === P.pose ? 1 : 0, 5.5, dt);
    }
    s.power = damp(s.power, P.pose === 'off' ? 0 : 1, P.pose === 'off' ? 2.2 : 4, dt);
    s.rev = damp(s.rev, P.reveal ? 1 : 0, 3, dt);
    s.dim = damp(s.dim, P.dimmed ? 1 : 0, 5, dt);
    s.sel = damp(s.sel, P.selected ? 1 : 0, 8, dt);

    // ---- expression
    const tgt = EXPRESSIONS[P.expression];
    const ex = s.ex;
    for (let i = 0; i < EXPR_KEYS.length; i++) {
      const k = EXPR_KEYS[i];
      ex[k] = damp(ex[k], tgt[k], 9, dt);
    }

    // ---- body channels, blended over poses
    let y = 0, tiltX = 0, tiltZ = 0, rotY = 0, sq = 0, breathe = 0;
    let hX = 0, hY = 0, hZ = 0;
    let aLx = 0, aLz = 0.12, aRx = 0, aRz = 0.12;
    let lL = 0, lR = 0, talk = 0, lidAdd = 0, lookDown = 0;

    const wi = w.idle;
    if (wi > 0.001) {
      breathe += wi * 0.018 * Math.sin(t * 2.1);
      y += wi * 0.006 * Math.sin(t * 2.1);
      hZ += wi * 0.045 * Math.sin(t * 0.9);
      hY += wi * 0.14 * Math.sin(t * 0.45);
      aLz += wi * 0.04 * Math.sin(t * 2.1);
      aRz += wi * 0.04 * Math.sin(t * 2.1 + 0.4);
    }
    const ww = w.walk;
    if (ww > 0.001) {
      const f = t * 9.5;
      const sn = Math.sin(f);
      y += ww * 0.045 * Math.abs(Math.sin(f));
      tiltX += ww * 0.12;
      tiltZ += ww * 0.075 * sn;
      rotY += ww * 0.06 * sn;
      lL += ww * 0.62 * sn;
      lR -= ww * 0.62 * sn;
      aLx -= ww * 0.75 * sn;
      aRx += ww * 0.75 * sn;
      hZ -= ww * 0.05 * sn;
      hX -= ww * 0.06;
      sq += ww * 0.03 * Math.cos(f * 2);
    }
    const wk = w.work;
    if (wk > 0.001) {
      const f = t * 13;
      tiltX += wk * 0.14;
      hX += wk * 0.28;
      y += wk * 0.008 * Math.sin(f * 2);
      aLx += wk * (-1.25 + 0.42 * Math.sin(f));
      aRx += wk * (-1.25 + 0.42 * Math.sin(f + Math.PI));
      aLz -= wk * 0.2;
      aRz -= wk * 0.2;
      hZ += wk * 0.05 * Math.sin(t * 2.3);
      rotY += wk * 0.05 * Math.sin(t * 1.7);
      lookDown += wk * 0.35;
    }
    const wt = w.talk;
    if (wt > 0.001) {
      hX += wt * 0.07 * Math.sin(t * 6.2);
      hZ += wt * 0.07 * Math.sin(t * 3.1);
      breathe += wt * 0.02 * Math.sin(t * 3.1);
      aRx += wt * (-0.75 + 0.3 * Math.sin(t * 4.2));
      aRz += wt * 0.22;
      aLx += wt * (-0.25 + 0.12 * Math.sin(t * 4.2 + 1.3));
      // syllable envelope: fast flap modulated by a slower phrase rhythm
      const flap = 0.5 + 0.5 * Math.sin(t * 17);
      const phrase = clamp(0.65 + 0.6 * Math.sin(t * 2.3) * Math.sin(t * 0.9 + 1), 0, 1);
      talk += wt * flap * phrase;
    }
    const wsd = w.sad;
    if (wsd > 0.001) {
      tiltX += wsd * 0.1;
      hX += wsd * 0.28;
      hZ += wsd * 0.12;
      y -= wsd * 0.025;
      sq -= wsd * 0.04;
      aLz -= wsd * 0.14;
      aRz -= wsd * 0.14;
      aLx += wsd * 0.12;
      aRx += wsd * 0.12;
      breathe += wsd * 0.012 * Math.sin(t * 1.2);
      lidAdd += wsd * 0.22;
      lookDown += wsd * 0.4;
    }
    const wo = w.off;
    if (wo > 0.001) {
      tiltX += wo * 0.16;
      tiltZ += wo * 0.06;
      hX += wo * 0.38;
      hZ -= wo * 0.2;
      y -= wo * 0.04;
      sq -= wo * 0.07;
      aLz -= wo * 0.1;
      aRz -= wo * 0.1;
      aLx += wo * 0.25;
      aRx += wo * 0.2;
      lookDown += wo * 0.5;
    }
    const wc = w.celebrate;
    if (wc > 0.001) {
      const f = t * 7.5;
      const h = Math.sin(f);
      const air = Math.max(0, h);
      y += wc * 0.15 * air;
      sq += wc * (h > 0 ? 0.07 * h : 0.1 * h);
      aLx += wc * (-2.7 + 0.25 * Math.sin(f * 2));
      aRx += wc * (-2.7 + 0.25 * Math.sin(f * 2 + 1));
      aLz += wc * 0.25;
      aRz += wc * 0.25;
      lL += wc * 0.35 * air;
      lR += wc * 0.35 * air;
      hZ += wc * 0.12 * Math.sin(f * 0.5);
      hX -= wc * 0.12;
      rotY += wc * 0.12 * Math.sin(f * 0.5);
    }

    // ---- reveal glitch
    let jx = 0, jy = 0, eyeJit = 0;
    const now = state.clock.elapsedTime;
    if (s.rev > 0.02) {
      if (now > s.glitchNext) {
        s.glitchUntil = now + 0.06 + Math.random() * 0.14;
        s.glitchNext = now + 0.25 + Math.random() * 1.1;
      }
      if (now < s.glitchUntil) {
        jx = (Math.random() - 0.5) * 0.035 * s.rev;
        jy = (Math.random() - 0.5) * 0.015 * s.rev;
        eyeJit = (Math.random() - 0.5) * s.rev;
      }
    }

    // ---- apply rig
    if (body.current) {
      body.current.position.set(jx, Math.max(-0.08, y), 0);
      body.current.rotation.set(tiltX, rotY, tiltZ);
      const sy = 1 + sq;
      body.current.scale.set(1 - sq * 0.5, sy, 1 - sq * 0.5);
    }
    if (torso.current) {
      const b = 1 + breathe;
      torso.current.scale.set(1 + breathe * 0.6, b, 1 + breathe * 0.6);
    }
    if (head.current) {
      head.current.rotation.set(hX, hY, hZ + jy * 3);
      head.current.position.x = jx * 1.5;
    }
    if (armL.current) armL.current.rotation.set(aLx, 0, -aLz);
    if (armR.current) armR.current.rotation.set(aRx, 0, aRz);
    if (legL.current) legL.current.rotation.x = lL;
    if (legR.current) legR.current.rotation.x = lR;

    if (extras.halo) {
      extras.halo.position.y = 0.56 + 0.018 * Math.sin(now * 2.2) - (1 - s.power) * 0.06;
      extras.halo.rotation.y = now * 0.7;
      extras.halo.rotation.z = 0.12 * Math.sin(now * 1.3) + (1 - s.power) * 0.35;
    }
    if (extras.antenna) {
      extras.antenna.rotation.z = 0.12 * Math.sin(t * 3.2) * (0.4 + w.walk + w.celebrate) - (1 - s.power) * 0.5;
    }

    // ---- eyes
    // Blink is a pure function of time since it started, so throttled frames never freeze it shut.
    if (now > s.blinkAt) {
      s.blink = now;
      s.blinkAt = now + 2.2 + Math.random() * 3.5;
      if (Math.random() < 0.2) s.blinkAt = now + 0.28; // occasional double blink
    }
    const bt = (now - s.blink) / 0.16;
    const blinkV = bt >= 0 && bt < 1 ? Math.sin(bt * Math.PI) : 0;

    if (now > s.lookAt) {
      s.lookAt = now + 1.1 + Math.random() * 2.4;
      s.lookX = (Math.random() - 0.5) * 0.5;
      s.lookY = (Math.random() - 0.5) * 0.25;
    }
    const lookW = w.idle + w.walk * 0.5;
    let tpx = ex.pX + s.lookX * lookW;
    let tpy = ex.pY + s.lookY * lookW - lookDown;
    if (P.expression === 'worried') tpx += Math.sin(now * 23) * 0.04; // nervous tremble
    s.pX = damp(s.pX, clamp(tpx, -0.38, 0.38), 12, dt);
    s.pY = damp(s.pY, clamp(tpy, -0.38, 0.38), 12, dt);

    const offK = 1 - s.power;
    const upper = clamp(Math.max(ex.uL + lidAdd, blinkV, offK * 0.82), 0, 1);
    const lower = clamp(ex.lL + offK * 0.1, 0, 0.6);
    const r = spec.eye.r;
    for (let i = 0; i < 2; i++) {
      const o = eyes[i];
      const side = i === 0 ? -1 : 1;
      if (!o.g) continue;
      const es = ex.eS * (1 + eyeJit * 0.25 * (i === 0 ? 1 : -1));
      o.g.scale.set(es * (1 + eyeJit * 0.3), es, spec.eye.flat);
      const px = clamp(s.pX + eyeJit * 0.3, -0.4, 0.4);
      const py = s.pY;
      o.p.rotation.set(-Math.asin(py), Math.asin(px) - side * spec.eye.rotY * 0.75, 0); // counter the outward plate turn so the gaze converges
      const ps = ex.pS * (1 + s.rev * 0.1) * 1.006 * r;
      o.pm.scale.set(ps, ps * (1 - offK * 0.3), 1.006 * r);
      o.lt.rotation.z = side * ex.lT;
      o.lu.rotation.x = -1.45 + upper * 2.95;
      o.ll.rotation.x = 1.45 - lower * 2.95;
      o.lu.visible = upper > 0.015;
      o.ll.visible = lower > 0.015;
      if (o.b) {
        const asY = i === 1 ? ex.bAY : 0;
        const asT = i === 1 ? ex.bAT : 0;
        o.b.position.y = spec.eye.y + r * (1.5 + (ex.bY + asY) * 1.0 - offK * 0.25) * (ex.eS * 0.3 + 0.7);
        // + bT = inner end down (angry). Left eye's inner end is +x.
        o.b.rotation.z = side * (ex.bT + asT);
      }
    }

    // ---- mouth
    if (mouth.segs && mouth.segs[0]) {
      const mw = spec.mouth.w;
      const c = ex.m * (1 - offK * 0.8);
      s.talkEnv = damp(s.talkEnv, talk, 20, dt);
      const open = s.talkEnv * (1 - offK);
      const curv = c * 0.55 * mw; // vertical rise at the ends
      const tiltM = ex.mT * 0.35 * mw;
      const thick = mw * 0.2;
      for (let i = 0; i < MOUTH_N; i++) {
        const u = (i / (MOUTH_N - 1)) * 2 - 1;
        const x = u * mw;
        const yv = curv * u * u + tiltM * u - curv * 0.35;
        const slope = (2 * curv * u + tiltM) / mw;
        const m = mouth.segs[i];
        m.position.set(x, yv, 0);
        m.rotation.z = Math.atan(slope);
        m.scale.set(mw / (MOUTH_N - 1) * 1.1 + thick * 0.6, thick, thick * 0.6);
      }
      const oy = Math.max(0.001, open * mw * 0.55);
      mouth.open.scale.set(Math.max(0.001, open * mw * 0.55), oy, mw * 0.2);
      mouth.open.position.y = -oy * 0.8 - curv * 0.2;
    }

    // ---- materials
    const desat = clamp(Math.max(offK * 0.85, s.dim * 0.65), 0, 1);
    const bright = 1 - s.dim * 0.35 - offK * 0.25;
    mats.body.color.copy(mats._base).lerp(mats._grey, desat).multiplyScalar(bright);
    mats.body.sheenColor.copy(mats.body.color);
    mats.trim.color.copy(mats._trimBase).lerp(mats._trimGrey, desat).multiplyScalar(bright);
    if (!mats.screen) mats.lid.color.copy(mats.body.color);

    let flick = 1;
    if (s.rev > 0.02) {
      flick = now < s.glitchUntil ? 0.35 + Math.random() * 1.2 : 0.9 + 0.1 * Math.sin(now * 40);
    }
    mats.seam.color.copy(mats._base).lerp(RED, s.rev).lerp(mats._grey, desat * (1 - s.rev));
    mats.seam.emissive.copy(mats.seam.color);
    mats.seam.emissiveIntensity =
      (1.5 + s.rev * 1.2) * Math.max(0.04, s.power) * (1 - s.dim * 0.55) * flick * (0.92 + 0.08 * Math.sin(now * 2.5 + s.seed * 6));

    const glowFace = spec.face === 'glow';
    mats.eye.color.copy(EYE_WHITE).lerp(EYE_REVEAL, s.rev).lerp(EYE_OFF, offK * 0.8);
    mats.eye.emissive.copy(glowFace ? GLOW_FACE : EYE_WHITE).lerp(RED, s.rev);
    mats.eye.emissiveIntensity =
      ((glowFace ? 0.9 : 0.12) + s.rev * 0.35) * (1 - offK * 0.95) * (1 - s.dim * 0.4) * (s.rev > 0.02 ? flick : 1);
    mats.pupil.emissive.copy(RED);
    mats.pupil.emissiveIntensity = s.rev * 2.2 * flick * s.power;
    if (mats.screen) {
      mats.screen.emissive.setRGB(0.012, 0.09, 0.16).lerp(RED, s.rev * 0.12);
      mats.screen.emissiveIntensity = (0.6 + s.rev * 0.5) * s.power * (1 - s.dim * 0.5);
    }

    // ---- selection ring
    if (ring.current) {
      const pulse = 1 + 0.04 * Math.sin(now * 4);
      ring.current.visible = s.sel > 0.01;
      ring.current.scale.setScalar((0.85 + 0.15 * s.sel) * pulse);
      mats.ringMat.opacity = 0.9 * s.sel;
      mats.discMat.opacity = 0.16 * s.sel;
      mats.ringMat.color.copy(mats._base).lerp(RED, s.rev);
      mats.discMat.color.copy(mats.ringMat.color);
    }
  });

  const hoverable = typeof onClick === 'function';
  useEffect(
    () => () => {
      if (hoverable) document.body.style.cursor = '';
    },
    [hoverable],
  );

  const Leg = spec.Leg;
  const Arm = spec.Arm;
  const Torso = spec.Torso;
  const Head = spec.Head;

  return (
    <group
      ref={root}
      {...groupProps}
      onClick={
        hoverable
          ? (e) => {
              e.stopPropagation();
              onClick(e);
            }
          : undefined
      }
      onPointerOver={hoverable ? (e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; } : undefined}
      onPointerOut={hoverable ? () => { document.body.style.cursor = ''; } : undefined}
    >
      <group ref={ring} position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <mesh geometry={g.ring(spec.ringR - 0.05, spec.ringR)} material={mats.ringMat} renderOrder={1} />
        <mesh geometry={g.disc(spec.ringR - 0.05)} material={mats.discMat} renderOrder={1} />
      </group>
      <group ref={body}>
        <group ref={legL} position={[-spec.hip.x, spec.hip.y, 0]}>
          <Leg m={mats} side={-1} />
        </group>
        <group ref={legR} position={[spec.hip.x, spec.hip.y, 0]}>
          <Leg m={mats} side={1} />
        </group>
        <group ref={torso}>
          <Torso m={mats} x={extras} />
          <group ref={armL} position={[-spec.shoulder.x, spec.shoulder.y, 0]}>
            <Arm m={mats} side={-1} />
          </group>
          <group ref={armR} position={[spec.shoulder.x, spec.shoulder.y, 0]}>
            <Arm m={mats} side={1} />
          </group>
          <group position={[0, spec.neckY, 0]}>
            <group ref={head}>
              <Head m={mats} x={extras} />
              <Eye side={-1} spec={spec} mats={mats} store={eyes[0]} />
              <Eye side={1} spec={spec} mats={mats} store={eyes[1]} />
              <Mouth spec={spec} mats={mats} store={mouth} />
            </group>
          </group>
        </group>
      </group>
      {children}
    </group>
  );
}

// ---------------------------------------------------------------- RobotPortrait
// Framing is fitted to the robot's real bounds (measured from its meshes, including halo /
// antenna), expanded by the envelope every pose can reach (hop, arm swing, slump, head tilt),
// then the camera distance is solved so every corner of that box lands inside the frustum
// with padding. So nothing clips, for any pose, at any aspect ratio.
const POSE_ENVELOPE = { top: 0.19, bottom: 0.02, side: 0.1, depth: 0.12 };
const PORTRAIT_PAD = 0.06; // fraction of the frame kept empty around the robot
const VIEW_DIR = new THREE.Vector3(0.16, 0.14, 1).normalize();
const _box = new THREE.Box3();
const _tmp = new THREE.Box3();
const _c = new THREE.Vector3();
const _v = new THREE.Vector3();
const _corners = Array.from({ length: 8 }, () => new THREE.Vector3());

function measureRobot(group) {
  _box.makeEmpty();
  group.updateWorldMatrix(true, true);
  group.traverseVisible((o) => {
    if (!o.isMesh || !o.geometry) return;
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    _tmp.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
    _box.union(_tmp);
  });
  _box.min.x -= POSE_ENVELOPE.side;
  _box.max.x += POSE_ENVELOPE.side;
  _box.min.z -= POSE_ENVELOPE.depth;
  _box.max.z += POSE_ENVELOPE.depth;
  _box.max.y += POSE_ENVELOPE.top;
  _box.min.y = Math.min(_box.min.y, 0) - POSE_ENVELOPE.bottom;
  return _box;
}

function fitCamera(camera, box) {
  box.getCenter(_c);
  // orient the camera along VIEW_DIR looking at the box centre
  camera.position.copy(_c).addScaledVector(VIEW_DIR, 3);
  camera.lookAt(_c);
  camera.updateMatrixWorld();
  const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * (1 - PORTRAIT_PAD * 2);
  const tanH = tanV * camera.aspect;
  const { min, max } = box;
  let k = 0;
  for (const x of [min.x, max.x]) for (const y of [min.y, max.y]) for (const z of [min.z, max.z]) _corners[k++].set(x, y, z);
  // camera basis
  const right = _v.set(1, 0, 0).applyQuaternion(camera.quaternion).clone();
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
  let dist = 0;
  for (const p of _corners) {
    const rel = p.clone().sub(_c);
    const cx = rel.dot(right);
    const cy = rel.dot(up);
    const cz = rel.dot(VIEW_DIR); // towards the camera
    dist = Math.max(dist, cz + Math.abs(cx) / tanH, cz + Math.abs(cy) / tanV);
  }
  camera.position.copy(_c).addScaledVector(VIEW_DIR, dist);
  camera.near = Math.max(0.01, dist - 3);
  camera.far = dist + 3;
  camera.lookAt(_c);
  camera.updateProjectionMatrix();
}

function PortraitRig({ id, pose, expression, reveal }) {
  const spec = ROBOT_SPECS[id] || ROBOT_SPECS.BOLT;
  const group = useRef();
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  useLayoutEffect(() => {
    if (!group.current) return;
    camera.aspect = size.width / Math.max(1, size.height);
    const b = measureRobot(group.current);
    fitCamera(camera, b);
  }, [camera, size.width, size.height, id]);
  return (
    <>
      <ambientLight intensity={0.35} color="#bfe9ea" />
      <hemisphereLight args={['#fff1dc', '#0b3a3f', 0.7]} />
      <directionalLight position={[1.6, 2.4, 2.2]} intensity={2.2} color="#fff3e2" />
      <directionalLight position={[-2.2, 1.2, -1.5]} intensity={1.6} color="#3EE6E0" />
      <directionalLight position={[2.2, 0.6, -1.8]} intensity={0.8} color={spec.color} />
      <Environment resolution={64} frames={1}>
        <Lightformer form="rect" intensity={2.4} position={[0, 2.5, 2.5]} scale={[4, 1.5, 1]} color="#fff5e6" />
        <Lightformer form="rect" intensity={1.2} position={[-3, 1, 0]} rotation={[0, Math.PI / 2, 0]} scale={[3, 2, 1]} color="#3EE6E0" />
        <Lightformer form="rect" intensity={0.8} position={[3, 1, 1]} rotation={[0, -Math.PI / 2, 0]} scale={[3, 2, 1]} color="#ffffff" />
      </Environment>
      <group ref={group}>
        <Robot id={id} pose={pose} expression={expression} reveal={reveal} rotation={[0, -0.22, 0]} />
      </group>
    </>
  );
}

/**
 * Self-contained transparent mini canvas showing the whole robot, auto-framed so no pose clips.
 * `size` is a number (square px) or omit it and pass width/height via style to fill a box.
 */
export function RobotPortrait({ id = 'BOLT', pose = 'idle', expression = 'neutral', reveal = false, size = 160, style, className }) {
  const spec = ROBOT_SPECS[id] || ROBOT_SPECS.BOLT;
  return (
    <div
      className={className}
      style={{ width: size, height: size, position: 'relative', flex: '0 0 auto', background: 'transparent', ...style }}
      aria-label={`${spec.name} portrait`}
      role="img"
    >
      <Canvas
        key={id}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true, premultipliedAlpha: true, powerPreference: 'low-power' }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor(0x000000, 0);
          scene.background = null;
        }}
        camera={{ position: [0, 0.6, 3], fov: 26, near: 0.1, far: 20 }}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: 'transparent', display: 'block' }}
      >
        <PortraitRig id={id} pose={pose} expression={expression} reveal={reveal} />
      </Canvas>
    </div>
  );
}
