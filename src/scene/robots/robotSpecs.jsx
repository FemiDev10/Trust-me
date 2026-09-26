// Per-robot anatomy. Units: the robot stands on y=0, ~1 unit tall, facing +Z.
// Rig layout (see Robot.jsx):
//   legs pivot at hip, arms pivot at shoulder (both hang along -Y),
//   head pivots at the neck; the head's local origin is the neck point.
import * as g from './geometry.js';

const M = ({ geo, m, cast = true, ...p }) => (
  <mesh geometry={geo} material={m} castShadow={cast} {...p} />
);

// ---------------------------------------------------------------- BOLT
// Boxy, squat, eager. Lightning-bolt antenna.
const BOLT = {
  name: 'BOLT',
  color: '#F5C518',
  trimMix: 0.5,
  hip: { x: 0.13, y: 0.16 },
  shoulder: { x: 0.27, y: 0.39 },
  neckY: 0.45,
  eye: { r: 0.105, x: 0.145, y: 0.235, z: 0.232, rotY: 0.05, flat: 0.34 },
  brow: { len: 1.15, z: 0.245 },
  mouth: { y: 0.1, z: 0.238, w: 0.06 },
  ringR: 0.44,
  portrait: { y: 0.74, d: 2.25 },
  Leg: ({ m }) => (
    <>
      <M geo={g.cyl(0.048, 0.052, 0.1)} m={m.graphite} position={[0, -0.05, 0]} />
      <M geo={g.rbox(0.15, 0.075, 0.2, 0.034)} m={m.body} position={[0, -0.122, 0.025]} />
      <M geo={g.rbox(0.152, 0.02, 0.202, 0.009)} m={m.trim} position={[0, -0.152, 0.025]} />
    </>
  ),
  Arm: ({ m }) => (
    <>
      <M geo={g.sphereLo()} m={m.graphite} scale={0.05} />
      <M geo={g.capsule(0.042, 0.07)} m={m.trim} position={[0, -0.07, 0]} />
      <M geo={g.rbox(0.1, 0.09, 0.09, 0.035)} m={m.body} position={[0, -0.15, 0]} />
    </>
  ),
  Torso: ({ m }) => (
    <>
      <M geo={g.rbox(0.46, 0.3, 0.36, 0.075)} m={m.body} position={[0, 0.3, 0]} />
      <M geo={g.roundedRectBand(0.455, 0.355, 0.072, 0.006, 0.02)} m={m.seam} position={[0, 0.38, 0]} cast={false} />
      <M geo={g.rbox(0.26, 0.13, 0.03, 0.014)} m={m.trim} position={[0, 0.28, 0.176]} />
      <M geo={g.cyl(0.018, 0.018, 0.02, 16)} m={m.seam} position={[-0.07, 0.28, 0.194]} rotation={[Math.PI / 2, 0, 0]} cast={false} />
      <M geo={g.cyl(0.018, 0.018, 0.02, 16)} m={m.graphite} position={[0, 0.28, 0.194]} rotation={[Math.PI / 2, 0, 0]} />
      <M geo={g.cyl(0.018, 0.018, 0.02, 16)} m={m.graphite} position={[0.07, 0.28, 0.194]} rotation={[Math.PI / 2, 0, 0]} />
      <M geo={g.cyl(0.07, 0.08, 0.04)} m={m.graphite} position={[0, 0.46, 0]} />
    </>
  ),
  Head: ({ m, x }) => (
    <>
      <M geo={g.rbox(0.64, 0.44, 0.46, 0.11)} m={m.body} position={[0, 0.23, 0]} />
      {/* ear bolts */}
      <M geo={g.cyl(0.06, 0.06, 0.06)} m={m.trim} position={[-0.33, 0.22, 0]} rotation={[0, 0, Math.PI / 2]} />
      <M geo={g.cyl(0.06, 0.06, 0.06)} m={m.trim} position={[0.33, 0.22, 0]} rotation={[0, 0, Math.PI / 2]} />
      <M geo={g.cyl(0.03, 0.03, 0.02)} m={m.seam} position={[-0.365, 0.22, 0]} rotation={[0, 0, Math.PI / 2]} cast={false} />
      <M geo={g.cyl(0.03, 0.03, 0.02)} m={m.seam} position={[0.365, 0.22, 0]} rotation={[0, 0, Math.PI / 2]} cast={false} />
      {/* antenna */}
      <group ref={(el) => (x.antenna = el)} position={[0.06, 0.45, -0.02]}>
        <M geo={g.cyl(0.05, 0.06, 0.03)} m={m.graphite} position={[0, 0, 0]} />
        <M geo={g.cyl(0.013, 0.013, 0.09)} m={m.graphite} position={[0, 0.055, 0]} />
        <M geo={g.boltShape()} m={m.seam} position={[0, 0.16, 0]} rotation={[0, 0, -0.15]} scale={1.05} />
      </group>
    </>
  ),
};

// ---------------------------------------------------------------- MOCHI
// Round soft dumpling head, tiny arms, gentle.
const MOCHI = {
  name: 'MOCHI',
  color: '#FF8FB8',
  trimMix: 0.55,
  hip: { x: 0.1, y: 0.075 },
  shoulder: { x: 0.185, y: 0.28 },
  neckY: 0.35,
  eye: { r: 0.1, x: 0.15, y: 0.25, z: 0.312, rotY: 0.36, flat: 0.42 },
  brow: { len: 1.0, z: 0.275 },
  mouth: { y: 0.125, z: 0.306, w: 0.045 },
  ringR: 0.42,
  portrait: { y: 0.62, d: 2.15 },
  Leg: ({ m }) => (
    <M geo={g.sphere()} m={m.trim} position={[0, -0.035, 0.02]} scale={[0.085, 0.05, 0.11]} />
  ),
  Arm: ({ m }) => (
    <>
      <M geo={g.sphere()} m={m.body} position={[0, -0.04, 0]} scale={[0.05, 0.065, 0.05]} />
    </>
  ),
  Torso: ({ m }) => (
    <>
      <M geo={g.sphere()} m={m.body} position={[0, 0.215, 0]} scale={[0.2, 0.17, 0.185]} />
      <M geo={g.sphere()} m={m.trim} position={[0, 0.2, 0.09]} scale={[0.12, 0.11, 0.1]} />
      <M geo={g.torus(1, 0.06)} m={m.seam} position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[0.17, 0.155, 0.17]} cast={false} />
    </>
  ),
  Head: ({ m }) => (
    <>
      <M geo={g.sphere()} m={m.body} position={[0, 0.25, 0]} scale={[0.38, 0.28, 0.335]} />
      {/* dumpling pinch */}
      <M geo={g.sphere()} m={m.body} position={[0, 0.52, 0]} scale={[0.09, 0.05, 0.09]} />
      <M geo={g.cone(0.045, 0.08)} m={m.body} position={[0, 0.575, 0]} />
      <M geo={g.torus(1, 0.18)} m={m.seam} position={[0, 0.535, 0]} rotation={[Math.PI / 2, 0, 0]} scale={0.07} cast={false} />
      {/* cheeks */}
      <M geo={g.sphere()} m={m.seam} position={[-0.25, 0.16, 0.235]} rotation={[0, -0.8, 0]} scale={[0.045, 0.028, 0.012]} cast={false} />
      <M geo={g.sphere()} m={m.seam} position={[0.25, 0.16, 0.235]} rotation={[0, 0.8, 0]} scale={[0.045, 0.028, 0.012]} cast={false} />
      {/* soft ear nubs */}
      <M geo={g.sphere()} m={m.trim} position={[-0.365, 0.28, 0]} scale={[0.04, 0.07, 0.07]} />
      <M geo={g.sphere()} m={m.trim} position={[0.365, 0.28, 0]} scale={[0.04, 0.07, 0.07]} />
    </>
  ),
};

// ---------------------------------------------------------------- ZIGGY
// Tall split-capsule body, zigzag headphones, chill.
const ZIGGY = {
  name: 'ZIGGY',
  color: '#4CC38A',
  trimMix: 0.5,
  hip: { x: 0.085, y: 0.17 },
  shoulder: { x: 0.2, y: 0.42 },
  neckY: 0.5,
  eye: { r: 0.088, x: 0.098, y: 0.29, z: 0.2, rotY: 0.45, flat: 0.42 },
  brow: { len: 1.05, z: 0.18 },
  mouth: { y: 0.15, z: 0.205, w: 0.04 },
  ringR: 0.36,
  portrait: { y: 0.76, d: 2.2 },
  Leg: ({ m }) => (
    <>
      <M geo={g.cyl(0.032, 0.036, 0.13)} m={m.graphite} position={[0, -0.075, 0]} />
      <M geo={g.rbox(0.11, 0.06, 0.16, 0.028)} m={m.trim} position={[0, -0.14, 0.025]} />
    </>
  ),
  Arm: ({ m }) => (
    <>
      <M geo={g.capsule(0.034, 0.12)} m={m.body} position={[0, -0.08, 0]} />
      <M geo={g.sphereLo()} m={m.trim} position={[0, -0.18, 0]} scale={0.048} />
    </>
  ),
  Torso: ({ m }) => (
    <>
      <M geo={g.capsule(0.19, 0.16)} m={m.body} position={[0, 0.37, 0]} />
      <M geo={g.torus(0.168, 0.012)} m={m.seam} position={[0, 0.553, 0]} rotation={[Math.PI / 2, 0, 0]} cast={false} />
      <M geo={g.torus(0.188, 0.008)} m={m.seam} position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]} cast={false} />
    </>
  ),
  Head: ({ m }) => (
    <>
      <M geo={g.capsule(0.205, 0.2)} m={m.body} position={[0, 0.25, 0]} />
      {/* headphones */}
      <M geo={g.zigzagBand(0.32, 0.045, 5, 0.018)} m={m.trim} position={[0, 0.25, -0.01]} scale={[0.82, 1, 1]} />
      <group position={[-0.215, 0.27, 0]} rotation={[0, 0, Math.PI / 2]}>
        <M geo={g.cyl(0.08, 0.08, 0.07)} m={m.graphite} />
        <M geo={g.torus(0.068, 0.012)} m={m.seam} position={[0, 0.037, 0]} rotation={[Math.PI / 2, 0, 0]} cast={false} />
      </group>
      <group position={[0.215, 0.27, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <M geo={g.cyl(0.08, 0.08, 0.07)} m={m.graphite} />
        <M geo={g.torus(0.068, 0.012)} m={m.seam} position={[0, 0.037, 0]} rotation={[Math.PI / 2, 0, 0]} cast={false} />
      </group>
    </>
  ),
};

// ---------------------------------------------------------------- PIP
// Chunky-bezel screen head, face drawn on the glass, boot feet, precise.
const PIP = {
  name: 'PIP',
  color: '#4A90E2',
  trimMix: 0.5,
  hip: { x: 0.1, y: 0.2 },
  shoulder: { x: 0.2, y: 0.39 },
  neckY: 0.45,
  eye: { r: 0.072, x: 0.105, y: 0.27, z: 0.212, rotY: 0, flat: 0.12 },
  brow: { len: 1.2, z: 0.216 },
  mouth: { y: 0.16, z: 0.216, w: 0.045 },
  face: 'glow',
  lid: 'screen',
  ringR: 0.42,
  portrait: { y: 0.7, d: 2.15 },
  Leg: ({ m }) => (
    <>
      <M geo={g.cyl(0.032, 0.032, 0.14)} m={m.graphite} position={[0, -0.08, 0]} />
      <M geo={g.rbox(0.13, 0.085, 0.19, 0.036)} m={m.body} position={[0, -0.155, 0.03]} />
      <M geo={g.rbox(0.132, 0.02, 0.192, 0.009)} m={m.graphite} position={[0, -0.19, 0.03]} />
    </>
  ),
  Arm: ({ m }) => (
    <>
      <M geo={g.capsule(0.035, 0.1)} m={m.trim} position={[0, -0.07, 0]} />
      <M geo={g.sphereLo()} m={m.body} position={[0, -0.16, 0]} scale={0.052} />
    </>
  ),
  Torso: ({ m }) => (
    <>
      <M geo={g.rbox(0.34, 0.25, 0.26, 0.07)} m={m.body} position={[0, 0.32, 0]} />
      <M geo={g.roundedRectBand(0.335, 0.255, 0.067, 0.006, 0.018)} m={m.seam} position={[0, 0.27, 0]} cast={false} />
      <M geo={g.rbox(0.16, 0.08, 0.02, 0.01)} m={m.trim} position={[0, 0.35, 0.13]} />
      <M geo={g.cyl(0.045, 0.05, 0.06)} m={m.graphite} position={[0, 0.46, 0]} />
    </>
  ),
  Head: ({ m }) => (
    <>
      {/* chunky bezel */}
      <M geo={g.rbox(0.66, 0.5, 0.38, 0.13)} m={m.body} position={[0, 0.26, -0.01]} />
      {/* glass */}
      <M geo={g.rbox(0.5, 0.34, 0.06, 0.05)} m={m.screen} position={[0, 0.265, 0.165]} />
      {/* seam around the glass */}
      <M geo={g.rbox(0.52, 0.36, 0.04, 0.055)} m={m.seam} position={[0, 0.265, 0.172]} cast={false} />
      {/* dials on the right cheek of the bezel */}
      <M geo={g.cyl(0.035, 0.035, 0.04)} m={m.trim} position={[0.335, 0.32, 0.02]} rotation={[0, 0, Math.PI / 2]} />
      <M geo={g.cyl(0.025, 0.025, 0.04)} m={m.trim} position={[0.335, 0.2, 0.02]} rotation={[0, 0, Math.PI / 2]} />
      {/* power LED */}
      <M geo={g.sphereLo()} m={m.seam} position={[0.23, 0.05, 0.17]} scale={0.014} cast={false} />
      {/* back vent */}
      <M geo={g.rbox(0.36, 0.26, 0.08, 0.04)} m={m.trim} position={[0, 0.26, -0.2]} />
    </>
  ),
};

// ---------------------------------------------------------------- JUNO
// Dome head with a floating halo, bell body, confident.
const JUNO = {
  name: 'JUNO',
  color: '#9B6BFF',
  trimMix: 0.55,
  hip: { x: 0.1, y: 0.1 },
  shoulder: { x: 0.18, y: 0.34 },
  neckY: 0.41,
  eye: { r: 0.098, x: 0.128, y: 0.19, z: 0.285, rotY: 0.42, flat: 0.42 },
  brow: { len: 1.05, z: 0.215 },
  mouth: { y: 0.075, z: 0.302, w: 0.042 },
  ringR: 0.4,
  portrait: { y: 0.72, d: 2.2 },
  Leg: ({ m }) => (
    <>
      <M geo={g.sphere()} m={m.trim} position={[0, -0.055, 0.02]} scale={[0.075, 0.05, 0.1]} />
    </>
  ),
  Arm: ({ m }) => (
    <>
      <M geo={g.capsule(0.032, 0.11)} m={m.trim} position={[0, -0.075, 0]} />
      <M geo={g.sphereLo()} m={m.body} position={[0, -0.165, 0]} scale={0.048} />
    </>
  ),
  Torso: ({ m }) => (
    <>
      <M
        geo={g.lathe('junoBody', [
          [0.0, 0.0],
          [0.17, 0.0],
          [0.215, 0.04],
          [0.215, 0.13],
          [0.17, 0.25],
          [0.12, 0.31],
          [0.0, 0.32],
        ])}
        m={m.body}
        position={[0, 0.07, 0]}
      />
      <M geo={g.torus(0.212, 0.012)} m={m.seam} position={[0, 0.16, 0]} rotation={[Math.PI / 2, 0, 0]} cast={false} />
      <M geo={g.sphere()} m={m.trim} position={[0, 0.28, 0.12]} scale={[0.05, 0.05, 0.025]} />
    </>
  ),
  Head: ({ m, x }) => (
    <>
      <M
        geo={g.lathe('junoDome', [
          [0.0, 0.0],
          [0.22, 0.0],
          [0.285, 0.04],
          [0.3, 0.13],
          [0.27, 0.28],
          [0.17, 0.39],
          [0.0, 0.43],
        ])}
        m={m.body}
        position={[0, -0.02, 0]}
      />
      <M geo={g.torus(0.29, 0.013)} m={m.seam} position={[0, 0.015, 0]} rotation={[Math.PI / 2, 0, 0]} cast={false} />
      {/* crest */}
      <M geo={g.sphere()} m={m.trim} position={[0, 0.405, 0]} scale={[0.035, 0.035, 0.12]} />
      {/* floating halo */}
      <group ref={(el) => (x.halo = el)} position={[0, 0.56, 0]}>
        <M geo={g.torus(0.16, 0.02)} m={m.seam} rotation={[Math.PI / 2 - 0.25, 0, 0]} cast={false} />
      </group>
    </>
  ),
};

export const ROBOT_SPECS = { BOLT, MOCHI, ZIGGY, PIP, JUNO };
export const ROBOT_IDS = Object.keys(ROBOT_SPECS);
export const ROBOT_COLORS = Object.fromEntries(ROBOT_IDS.map((k) => [k, ROBOT_SPECS[k].color]));
