import { memo, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Instances, Instance } from '@react-three/drei';
import { B, Ball, Cyl, Rug } from './primitives.jsx';
import { GEO, MOOD_MATS, mat, roundedBoxGeo } from './materials.js';
import { DOCK_PADS } from '../layout.js';

// Chunky toy furniture, 2–4 hero props per room so each room reads at a glance.
// All coordinates are world space (see layout.js for the room rectangles).

const WOOD = '#a86b40';
const WOOD_D = '#7a4a2b';
const INK = '#1d2426';
const CREAM = '#f1e6d2';
const R90 = Math.PI / 2;

function Kitchen() {
  return (
    <group>
      {/* counter run along the back wall */}
      <B s={[4.3, 0.68, 0.8]} at={[-3.15, 0, -6.5]} c={CREAM} />
      <B s={[4.4, 0.08, 0.9]} at={[-3.15, 0.68, -6.5]} c="#3b4a4c" r={0.03} />
      {[-4.9, -4.1, -3.3, -2.5, -1.7].map((x) => (
        <B key={x} s={[0.7, 0.5, 0.03]} at={[x, 0.09, -6.09]} c="#e4d6bf" r={0.02} shadow={false} />
      ))}
      {/* hob + sink */}
      <B s={[0.8, 0.03, 0.6]} at={[-4.3, 0.76, -6.5]} c={INK} r={0.01} />
      <Cyl r={0.12} h={0.02} at={[-4.5, 0.79, -6.62]} c="#ff7a3a" m={mat('#3a1a10', { emissive: '#ff5a1e', ei: 0.8 })} />
      <B s={[0.7, 0.03, 0.5]} at={[-2.2, 0.765, -6.5]} c="#9fb4b8" r={0.01} />
      <Cyl r={0.03} h={0.25} at={[-2.2, 0.76, -6.8]} c="#c9d4d6" />
      {/* retro fridge */}
      <B s={[0.9, 1.55, 0.8]} at={[-0.35, 0, -6.45]} c="#8fd0c4" r={0.14} />
      <B s={[0.05, 0.4, 0.05]} at={[-0.02, 0.9, -6.03]} c="#dfe8e6" r={0.02} />
      <B s={[0.05, 0.25, 0.05]} at={[-0.02, 0.45, -6.03]} c="#dfe8e6" r={0.02} />
      {/* round meeting table: the hub */}
      <Rug s={[3.6, 3.6]} at={[-2.4, 0.004, -3.9]} round c="#c4553d" m={mat('#b85a3e', { rough: 1 })} />
      <Cyl r={0.5} h={0.05} at={[-2.4, 0, -3.9]} c={WOOD_D} />
      <Cyl r={0.16} h={0.5} at={[-2.4, 0, -3.9]} c={WOOD_D} />
      <Cyl r={1.1} h={0.09} at={[-2.4, 0.5, -3.9]} c={WOOD} />
      <Cyl r={0.26} h={0.08} at={[-2.4, 0.59, -3.9]} c={CREAM} />
      <Ball r={0.09} at={[-2.47, 0.72, -3.86]} c="#ff6b4a" />
      <Ball r={0.08} at={[-2.3, 0.71, -3.95]} c="#f5c542" />
      <Ball r={0.08} at={[-2.42, 0.72, -4.02]} c="#7cc26b" />
    </group>
  );
}

/** Charging dock: 5 pads. Pads glow cyan; the Robot sits on them when unplugged / sitting out. */
function Dock() {
  const pad = mat('#10383c', { emissive: '#3ee6e0', ei: 0.9 });
  return (
    <group>
      <B s={[1.6, 0.06, 4.1]} at={[0.65, 0, -4.7]} c="#22363a" r={0.03} />
      <B s={[0.14, 0.62, 4.1]} at={[1.36, 0, -4.7]} c="#2c464b" r={0.05} />
      <B s={[0.03, 0.05, 3.8]} at={[1.28, 0.5, -4.7]} m={pad} r={0.01} shadow={false} />
      {DOCK_PADS.map(([x, z]) => (
        <group key={z}>
          <Cyl r={0.34} h={0.07} at={[x, 0.03, z]} c="#2f4a4f" />
          <mesh geometry={GEO.torus} material={pad} position={[x, 0.105, z]} rotation={[-R90, 0, 0]} scale={[0.27, 0.27, 0.6]} />
        </group>
      ))}
    </group>
  );
}

function Screen({ x, y, alt }) {
  return (
    <group position={[x, y, 1.42]}>
      <mesh geometry={roundedBoxGeo(0.86, 0.56, 0.1, 0.04)} material={mat('#182022')} castShadow />
      <mesh geometry={roundedBoxGeo(0.74, 0.44, 0.02, 0.01)} material={alt ? MOOD_MATS.screenAlt : MOOD_MATS.screen} position={[0, 0, 0.055]} />
    </group>
  );
}

function Security() {
  return (
    <group>
      <B s={[2.6, 0.52, 0.8]} at={[-7.65, 0, 1.62]} c="#34474c" />
      <B s={[2.7, 0.06, 0.9]} at={[-7.65, 0.52, 1.62]} c="#23313a" r={0.02} />
      <B s={[0.12, 1.3, 0.12]} at={[-7.65, 0.55, 1.3]} c="#182022" />
      <Screen x={-8.1} y={1.0} />
      <Screen x={-7.2} y={1.0} alt />
      <Screen x={-8.1} y={1.6} alt />
      <Screen x={-7.2} y={1.6} />
      {/* keyboard + mug */}
      <B s={[0.7, 0.04, 0.24]} at={[-7.6, 0.58, 1.9]} c="#1f2a2c" r={0.02} />
      <Cyl r={0.07} h={0.13} at={[-6.85, 0.58, 1.85]} c="#ff3b3b" />
      {/* swivel chair */}
      <Cyl r={0.05} h={0.3} at={[-7.6, 0, 2.55]} c="#20292b" />
      <B s={[0.6, 0.12, 0.55]} at={[-7.6, 0.3, 2.55]} c="#e0573f" r={0.06} />
      <B s={[0.56, 0.5, 0.1]} at={[-7.6, 0.42, 2.84]} c="#e0573f" r={0.05} />
      {/* server rack with blinking LEDs */}
      <B s={[0.75, 1.25, 0.7]} at={[-8.45, 0, 5.3]} c="#263033" r={0.07} />
      <Leds x={-8.07} y0={0.25} z={5.3} />
    </group>
  );
}

function Leds({ x, y0, z }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    ref.current.children.forEach((c, i) => { c.visible = Math.sin(t * (2 + i * 0.7) + i * 1.3) > -0.3; });
  });
  const green = mat('#0c2a12', { emissive: '#5be38c', ei: 2 });
  const amber = mat('#2a1c0c', { emissive: '#ffc53d', ei: 2 });
  return (
    <group ref={ref}>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <mesh key={i} geometry={GEO.box} material={i % 3 === 0 ? amber : green}
          position={[x, y0 + Math.floor(i / 2) * 0.22, z - 0.15 + (i % 2) * 0.12]} scale={[0.02, 0.05, 0.07]} />
      ))}
    </group>
  );
}

function Office() {
  const books = ['#e0573f', '#f5c542', '#3f8f86', '#6f86c9', '#efe3cf', '#b56aa8'];
  return (
    <group>
      {/* desk with lamp + laptop */}
      <B s={[1.9, 0.08, 0.85]} at={[-3.3, 0.55, 1.6]} c={WOOD} r={0.03} />
      <B s={[0.5, 0.55, 0.75]} at={[-4.0, 0, 1.6]} c={WOOD_D} />
      <B s={[0.08, 0.55, 0.7]} at={[-2.45, 0, 1.6]} c={WOOD_D} r={0.03} />
      <B s={[0.6, 0.03, 0.42]} at={[-3.25, 0.63, 1.7]} c="#c9d4d6" r={0.015} />
      <B s={[0.6, 0.38, 0.03]} at={[-3.25, 0.66, 1.5]} c="#c9d4d6" r={0.015} rot={[-0.2, 0, 0]} />
      <Cyl r={0.1} h={0.03} at={[-2.75, 0.63, 1.45]} c={INK} />
      <Cyl r={0.02} h={0.35} at={[-2.75, 0.63, 1.45]} c={INK} />
      <Ball r={0.12} at={[-2.75, 1.02, 1.5]} m={MOOD_MATS.bulb} shadow={false} />
      {/* THE KEY DRAWER: brass-trimmed cabinet */}
      <B s={[0.7, 0.95, 1.1]} at={[-4.6, 0, 3.9]} c="#2f5f5a" r={0.07} />
      {[0.2, 0.5, 0.8].map((y) => (
        <group key={y}>
          <B s={[0.04, 0.24, 0.95]} at={[-4.24, y - 0.08, 3.9]} c="#3b726b" r={0.02} />
          <B s={[0.05, 0.05, 0.2]} at={[-4.2, y + 0.02, 3.9]} c="#e2b24a" r={0.02} />
        </group>
      ))}
      {/* key board on the wall above it */}
      <B s={[0.06, 0.45, 1.0]} at={[-4.9, 1.0, 3.9]} c={CREAM} r={0.02} />
      {['#e2b24a', '#ff3b3b', '#3ee6e0', '#e2b24a', '#9b6bff'].map((c, i) => (
        <B key={i} s={[0.05, 0.16, 0.08]} at={[-4.84, 1.1, 3.55 + i * 0.18]} c={c} r={0.02} shadow={false} />
      ))}
      {/* bookshelf */}
      <B s={[0.4, 1.0, 1.4]} at={[-1.3, 0, 3.4]} c={WOOD_D} />
      {[0.1, 0.55].map((y) => books.map((c, i) => (
        <B key={`${y}${i}`} s={[0.26, 0.32 + (i % 3) * 0.04, 0.16]} at={[-1.33, y + 0.03, 2.85 + i * 0.21]} c={c} r={0.02} shadow={false} />
      )))}
      <Plant at={[-1.4, 0, 5.5]} />
    </group>
  );
}

function Living() {
  const sofa = '#3f7280';
  return (
    <group>
      <Rug s={[4.2, 2.8]} at={[5.5, 0, -4.4]} c="#d58a5c" m={mat('#cf8a5d', { rough: 1 })} />
      <Rug s={[3.6, 2.2]} at={[5.5, 0.006, -4.4]} c="#e8c69a" m={mat('#e9c99d', { rough: 1 })} />
      {/* sofa against back wall */}
      <B s={[3.2, 0.4, 0.95]} at={[5.5, 0, -6.35]} c={sofa} r={0.12} />
      <B s={[3.2, 0.55, 0.3]} at={[5.5, 0.3, -6.75]} c={sofa} r={0.12} />
      <B s={[0.32, 0.62, 0.95]} at={[3.95, 0, -6.35]} c={sofa} r={0.14} />
      <B s={[0.32, 0.62, 0.95]} at={[7.05, 0, -6.35]} c={sofa} r={0.14} />
      <B s={[1.3, 0.16, 0.8]} at={[4.85, 0.4, -6.28]} c="#4a8190" r={0.07} />
      <B s={[1.3, 0.16, 0.8]} at={[6.15, 0.4, -6.28]} c="#4a8190" r={0.07} />
      <B s={[0.45, 0.4, 0.14]} at={[4.4, 0.55, -6.55]} c="#f5c542" r={0.07} rot={[0, 0.2, 0]} />
      <B s={[0.45, 0.4, 0.14]} at={[6.65, 0.55, -6.55]} c="#e0573f" r={0.07} rot={[0, -0.2, 0]} />
      {/* coffee table */}
      <B s={[1.5, 0.08, 0.75]} at={[5.5, 0.3, -4.6]} c={WOOD} r={0.04} />
      {[[-0.6, -0.28], [0.6, -0.28], [-0.6, 0.28], [0.6, 0.28]].map(([dx, dz]) => (
        <Cyl key={`${dx}${dz}`} r={0.04} h={0.3} at={[5.5 + dx, 0, -4.6 + dz]} c={WOOD_D} />
      ))}
      <Cyl r={0.12} h={0.08} at={[5.3, 0.38, -4.6]} c={CREAM} />
      {/* TV on the east wall */}
      <B s={[0.5, 0.42, 1.8]} at={[8.6, 0, -4.4]} c="#2b3538" />
      <group position={[8.65, 0.95, -4.4]} rotation={[0, -R90, 0]}>
        <mesh geometry={roundedBoxGeo(1.5, 0.85, 0.08, 0.03)} material={mat('#141b1d')} castShadow />
        <mesh geometry={roundedBoxGeo(1.38, 0.74, 0.02, 0.01)} material={MOOD_MATS.screen} position={[0, 0, 0.045]} />
      </group>
      {/* floor lamp */}
      <Cyl r={0.18} h={0.04} at={[2.1, 0, -6.45]} c={INK} />
      <Cyl r={0.025} h={1.1} at={[2.1, 0, -6.45]} c={INK} />
      <Cyl r={0.24} h={0.28} at={[2.1, 1.05, -6.45]} m={mat('#f4e3c3', { emissive: '#ffb45a', ei: 0.9 })} />
      <Plant at={[8.4, 0, -6.4]} big />
    </group>
  );
}

function Garage() {
  const car = '#d0603f';
  const glass = mat('#1d3d45', { rough: 0.15, metal: 0.2 });
  const tyre = mat('#1b1f20', { rough: 0.9 });
  return (
    <group>
      <Rug s={[1.4, 1.4]} at={[-11.2, 0.004, -2.4]} round m={mat('#4c5358', { rough: 1 })} />
      {/* toy car */}
      <group position={[-11.8, 0, -4.3]}>
        <B s={[1.75, 0.55, 3.3]} at={[0, 0.2, 0]} c={car} r={0.22} />
        <B s={[1.5, 0.5, 1.8]} at={[0, 0.66, -0.2]} c={car} r={0.2} />
        <B s={[1.54, 0.34, 1.5]} at={[0, 0.74, -0.2]} m={glass} r={0.1} />
        <B s={[1.4, 0.07, 0.18]} at={[0, 0.5, 1.62]} c="#f4e3c3" r={0.03} m={mat('#fff1d0', { emissive: '#ffe2a0', ei: 1.1 })} />
        {[[-0.85, -1.1], [0.85, -1.1], [-0.85, 1.05], [0.85, 1.05]].map(([x, z]) => (
          <group key={`${x}${z}`}>
            <mesh geometry={GEO.cyl} material={tyre} position={[x, 0.3, z]} rotation={[0, 0, R90]} scale={[0.3, 0.26, 0.3]} castShadow />
            <mesh geometry={GEO.cyl} material={mat('#d9dcdc', { metal: 0.4, rough: 0.35 })} position={[x * 1.02, 0.3, z]} rotation={[0, 0, R90]} scale={[0.14, 0.27, 0.14]} />
          </group>
        ))}
      </group>
      {/* workbench + pegboard */}
      <B s={[0.8, 0.62, 2.2]} at={[-13.5, 0, -0.9]} c="#566166" />
      <B s={[0.9, 0.08, 2.3]} at={[-13.5, 0.62, -0.9]} c={WOOD} r={0.03} />
      <B s={[0.06, 0.7, 2.1]} at={[-13.92, 0.85, -0.9]} c="#c9a878" r={0.02} />
      <B s={[0.05, 0.4, 0.08]} at={[-13.86, 1.0, -1.5]} c="#e0573f" r={0.02} shadow={false} />
      <B s={[0.05, 0.3, 0.12]} at={[-13.86, 1.05, -1.0]} c="#3f8f86" r={0.02} shadow={false} />
      <B s={[0.05, 0.12, 0.4]} at={[-13.86, 1.2, -0.4]} c="#f5c542" r={0.02} shadow={false} />
      <B s={[0.3, 0.2, 0.4]} at={[-13.5, 0.7, -0.3]} c="#e0573f" r={0.05} />
      <B s={[0.25, 0.18, 0.25]} at={[-13.45, 0.7, -1.6]} c="#3d4a4f" r={0.04} />
      {/* shelving + boxes on back wall */}
      <B s={[1.8, 0.06, 0.45]} at={[-10.1, 0.45, -6.7]} c="#6b7478" r={0.02} />
      <B s={[1.8, 0.06, 0.45]} at={[-10.1, 0.95, -6.7]} c="#6b7478" r={0.02} />
      <B s={[0.5, 0.36, 0.4]} at={[-10.6, 0.51, -6.7]} c="#c9a878" r={0.03} />
      <B s={[0.45, 0.3, 0.4]} at={[-9.9, 0.51, -6.7]} c="#b8935f" r={0.03} />
      <B s={[0.6, 0.3, 0.4]} at={[-10.3, 1.01, -6.7]} c="#c9a878" r={0.03} />
      <Cyl r={0.2} h={0.45} at={[-9.5, 0, -6.6]} c="#3f8f86" />
    </group>
  );
}

function Machine({ x, c }) {
  return (
    <group>
      <B s={[0.82, 0.88, 0.75]} at={[x, 0, -6.48]} c={c} r={0.08} />
      <mesh geometry={GEO.cyl} material={mat('#c8d0d0')} position={[x, 0.4, -6.08]} rotation={[R90, 0, 0]} scale={[0.27, 0.04, 0.27]} />
      <mesh geometry={GEO.cyl} material={mat('#27454b', { rough: 0.15, metal: 0.1 })} position={[x, 0.4, -6.06]} rotation={[R90, 0, 0]} scale={[0.2, 0.04, 0.2]} />
      <B s={[0.5, 0.08, 0.03]} at={[x, 0.74, -6.1]} c="#3b4a4c" r={0.01} shadow={false} />
    </group>
  );
}

function Utility() {
  const white = '#eef1ee';
  return (
    <group>
      <Machine x={-8.45} c={white} />
      <Machine x={-7.55} c="#d8e5e3" />
      <B s={[1.8, 0.05, 0.35]} at={[-8.0, 1.12, -6.75]} c={WOOD} r={0.02} />
      <B s={[0.3, 0.3, 0.25]} at={[-8.5, 1.17, -6.75]} c="#6f86c9" r={0.05} />
      <B s={[0.25, 0.38, 0.22]} at={[-7.9, 1.17, -6.75]} c="#ff8fb8" r={0.05} />
      {/* laundry basket + tank */}
      <Cyl r={0.32} h={0.42} at={[-6.1, 0, -5.4]} c="#c79a5a" />
      <Ball r={0.26} sc={[0.3, 0.12, 0.3]} at={[-6.1, 0.44, -5.4]} c="#9fc6e8" />
      <Cyl r={0.3} h={1.1} at={[-6.1, 0, -6.55]} c="#d5dcdc" />
      <Cyl r={0.31} h={0.05} at={[-6.1, 1.1, -6.55]} c="#aeb7b8" />
    </group>
  );
}

function Bedroom() {
  return (
    <group>
      <Rug s={[2.2, 2.2]} at={[1.2, 0.004, 4.4]} round m={mat('#e8cfa4', { rough: 1 })} />
      <B s={[2.1, 0.85, 0.16]} at={[2.5, 0, 1.2]} c={WOOD_D} r={0.07} />
      <B s={[1.95, 0.32, 2.45]} at={[2.5, 0, 2.45]} c={WOOD} r={0.06} />
      <B s={[1.85, 0.2, 2.35]} at={[2.5, 0.3, 2.47]} c="#f6efe4" r={0.09} />
      <B s={[1.9, 0.13, 1.55]} at={[2.5, 0.46, 2.95]} c="#5b73c2" r={0.06} />
      <B s={[0.7, 0.17, 0.4]} at={[2.05, 0.5, 1.6]} c="#fffaf2" r={0.08} />
      <B s={[0.7, 0.17, 0.4]} at={[2.95, 0.5, 1.6]} c="#fffaf2" r={0.08} />
      {/* nightstand + lamp */}
      <B s={[0.45, 0.45, 0.45]} at={[3.72, 0, 1.45]} c={WOOD_D} r={0.05} />
      <Cyl r={0.13} h={0.2} at={[3.72, 0.45, 1.45]} m={mat('#f4e3c3', { emissive: '#ffb45a', ei: 0.9 })} />
      {/* wardrobe */}
      <B s={[0.5, 1.05, 1.5]} at={[-0.7, 0, 1.95]} c="#d9c3a2" r={0.06} />
      <B s={[0.03, 0.9, 0.02]} at={[-0.44, 0.08, 1.95]} c="#8b7355" r={0.005} shadow={false} />
    </group>
  );
}

function Kids() {
  const blocks = [['#ff5a5a', 0, 0], ['#f5c542', 0.34, 0], ['#4a90e2', 0.17, 0.32], ['#4cc38a', 0.62, 0.05]];
  return (
    <group>
      <Rug s={[2.8, 2.8]} at={[6.3, 0.004, 3.9]} round m={mat('#8fd3c8', { rough: 1 })} />
      <Rug s={[1.6, 1.6]} at={[6.3, 0.008, 3.9]} round m={mat('#f7e3a1', { rough: 1 })} />
      {/* small bed */}
      <B s={[1.2, 0.3, 1.9]} at={[8.25, 0, 2.2]} c="#f5c542" r={0.1} />
      <B s={[1.1, 0.16, 1.8]} at={[8.25, 0.28, 2.22]} c="#fffaf2" r={0.07} />
      <B s={[1.14, 0.1, 1.1]} at={[8.25, 0.42, 2.6]} c="#ff8a5b" r={0.05} />
      <B s={[0.6, 0.15, 0.35]} at={[8.25, 0.44, 1.5]} c="#fffaf2" r={0.07} />
      {/* toy blocks, ball, toy chest */}
      {blocks.map(([c, x, y], i) => (
        <B key={i} s={[0.3, 0.3, 0.3]} at={[4.6 + x, y, 5.3 - (i % 2) * 0.12]} c={c} r={0.05} rot={[0, i * 0.35, 0]} />
      ))}
      <Ball r={0.23} at={[7.4, 0.23, 5.45]} c="#ff5a5a" />
      <B s={[0.9, 0.46, 0.5]} at={[4.65, 0, 1.45]} c="#9b6bff" r={0.08} />
      <B s={[0.95, 0.1, 0.55]} at={[4.65, 0.46, 1.45]} c="#b58cff" r={0.05} />
      {/* rocket night light */}
      <Cyl r={0.12} h={0.5} at={[8.7, 0, 5.5]} c="#efe3cf" />
      <mesh position={[8.7, 0.62, 5.5]} material={mat('#ff5a5a')} castShadow>
        <coneGeometry args={[0.12, 0.24, 16]} />
      </mesh>
    </group>
  );
}

function Hallway() {
  return (
    <group>
      <Rug s={[16.4, 0.95]} at={[0, 0, 0]} m={mat('#7d3b3a', { rough: 1 })} />
      <Rug s={[16.0, 0.75]} at={[0, 0.006, 0]} m={mat('#95504a', { rough: 1 })} />
      <Plant at={[-8.5, 0, 0.62]} />
      <Plant at={[8.45, 0, -0.62]} big />
      {/* coat stand + console */}
      <Cyl r={0.16} h={0.04} at={[-3.0, 0, -0.66]} c={INK} />
      <Cyl r={0.03} h={1.1} at={[-3.0, 0, -0.66]} c={WOOD_D} />
      <Ball r={0.2} sc={[0.2, 0.26, 0.16]} at={[-3.0, 0.9, -0.62]} c="#e0573f" />
      <B s={[1.0, 0.08, 0.3]} at={[7.2, 0.5, 0.78]} c={WOOD} r={0.03} />
      <B s={[0.06, 0.5, 0.26]} at={[6.75, 0, 0.78]} c={WOOD_D} r={0.02} />
      <B s={[0.06, 0.5, 0.26]} at={[7.65, 0, 0.78]} c={WOOD_D} r={0.02} />
      <Cyl r={0.08} h={0.2} at={[7.0, 0.58, 0.78]} c="#3f8f86" />
    </group>
  );
}

function Plant({ at, big = false }) {
  const s = big ? 1.25 : 1;
  return (
    <group position={at} scale={s}>
      <Cyl r={0.17} h={0.28} c="#d27a52" />
      <Ball r={0.22} sc={[0.24, 0.3, 0.24]} at={[0, 0.48, 0]} c="#4f9a5a" />
      <Ball r={0.15} sc={[0.16, 0.2, 0.16]} at={[0.12, 0.64, 0.05]} c="#5fb06a" />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Garden + neighbour. Fences use instancing (lots of identical boards).

function FenceRun({ from, to, h = 0.6, c = '#e9dcc4', step = 0.32, board = [0.2, 0.05] }) {
  const pts = useMemo(() => {
    const [x0, z0] = from; const [x1, z1] = to;
    const len = Math.hypot(x1 - x0, z1 - z0);
    const n = Math.max(2, Math.round(len / step));
    return Array.from({ length: n + 1 }, (_, i) => [x0 + ((x1 - x0) * i) / n, z0 + ((z1 - z0) * i) / n]);
  }, [from, to, step]);
  const rotY = Math.atan2(to[0] - from[0], to[1] - from[1]) + R90;
  const len = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const mid = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
  return (
    <group>
      <Instances geometry={roundedBoxGeo(board[0], h, board[1], 0.025)} material={mat(c)} castShadow receiveShadow limit={200}>
        {pts.map(([x, z], i) => (
          <Instance key={i} position={[x, h / 2, z]} rotation={[0, rotY, 0]} />
        ))}
      </Instances>
      {[0.18, h - 0.14].map((y) => (
        <mesh key={y} geometry={roundedBoxGeo(len, 0.07, 0.05, 0.02)} material={mat(c)} position={[mid[0], y, mid[1]]} rotation={[0, rotY, 0]} castShadow />
      ))}
    </group>
  );
}

function Bin({ at, c }) {
  return (
    <group position={at}>
      <B s={[0.58, 0.82, 0.62]} c={c} r={0.07} />
      <B s={[0.64, 0.08, 0.7]} at={[0, 0.82, 0.02]} c={c} r={0.03} m={mat(c, { rough: 0.4 })} />
      <mesh geometry={GEO.cyl} material={mat('#1b1f20')} position={[0.3, 0.1, 0.28]} rotation={[0, 0, R90]} scale={[0.1, 0.06, 0.1]} />
      <mesh geometry={GEO.cyl} material={mat('#1b1f20')} position={[-0.3, 0.1, 0.28]} rotation={[0, 0, R90]} scale={[0.1, 0.06, 0.1]} />
    </group>
  );
}

function Garden() {
  return (
    <group>
      {/* stepping stones from the back door */}
      {[[9.7, 0.1], [10.45, 0.35], [11.2, 0.0], [11.95, 0.3]].map(([x, z], i) => (
        <mesh key={i} geometry={GEO.cyl} material={mat('#c9c3b5', { rough: 0.9 })} position={[x, 0.02, z]} scale={[0.28, 0.04, 0.24]} receiveShadow />
      ))}
      {/* wheelie bins, back corner */}
      <Bin at={[14.3, 0, -6.35]} c="#2f6b45" />
      <Bin at={[14.3, 0, -5.55]} c="#2f5f95" />
      <Bin at={[14.3, 0, -4.75]} c="#56606a" />
      {/* shed */}
      <group position={[13.9, 0, -2.9]}>
        <B s={[1.3, 0.95, 1.2]} c="#9c6b4a" r={0.05} />
        <B s={[1.5, 0.1, 1.4]} at={[0, 0.95, 0]} c="#5c3d2c" r={0.04} rot={[0, 0, 0.12]} />
        <B s={[0.03, 0.7, 0.5]} at={[-0.66, 0, 0]} c="#7a4f35" r={0.01} />
      </group>
      {/* tree */}
      <Cyl r={0.14} h={0.9} at={[14.1, 0, 4.9]} c="#7a5236" />
      <Ball r={0.75} sc={[0.8, 0.7, 0.8]} at={[14.1, 1.35, 4.9]} c="#3f8f55" />
      <Ball r={0.5} sc={[0.55, 0.5, 0.55]} at={[13.6, 1.1, 5.2]} c="#4fa565" />
      {/* flower bed along the house wall */}
      <B s={[0.5, 0.18, 2.4]} at={[9.4, 0, 3.8]} c="#6b4a33" r={0.05} />
      {[3.0, 3.4, 3.8, 4.2, 4.6].map((z, i) => (
        <Ball key={z} r={0.1} at={[9.4, 0.3, z]} c={['#ff8fb8', '#f5c542', '#ff5a5a', '#9b6bff', '#fff1d0'][i]} />
      ))}
      {/* our fence */}
      <FenceRun from={[9.1, -7]} to={[15, -7]} />
      <FenceRun from={[15, -7]} to={[15, 6]} />
      <FenceRun from={[9.1, 6]} to={[15, 6]} />
      {/* neighbour's plot + their taller, different fence */}
      <mesh position={[16.35, -0.03, -0.5]} receiveShadow geometry={roundedBoxGeo(1.7, 0.1, 13.8, 0.04)} material={mat('#3f6f45', { rough: 1 })} />
      <FenceRun from={[15.55, -7.3]} to={[15.55, 6.3]} h={0.95} c="#7f93ab" step={0.26} board={[0.24, 0.06]} />
      <Ball r={0.35} sc={[0.45, 0.4, 0.45]} at={[16.5, 0.3, 3.5]} c="#2f6f45" />
      <group position={[16.4, 0, -3.8]}>
        <Cyl r={0.12} h={0.35} c="#3f6fb5" />
        <mesh position={[0, 0.48, 0]} material={mat('#e0573f')} castShadow>
          <coneGeometry args={[0.12, 0.28, 12]} />
        </mesh>
        <Ball r={0.09} at={[0, 0.38, 0.02]} c="#f2d0b0" />
      </group>
    </group>
  );
}

function Driveway() {
  return (
    <group>
      <mesh position={[-11.5, -0.02, 3.6]} receiveShadow geometry={roundedBoxGeo(4.6, 0.06, 4.8, 0.03)} material={mat('#5d676b', { rough: 0.95 })} />
      <Plant at={[-13.6, 0, 5.5]} big />
      <Bin at={[-9.6, 0, 5.3]} c="#2f5f95" />
    </group>
  );
}

function PropsImpl() {
  return (
    <group>
      <Kitchen />
      <Dock />
      <Security />
      <Office />
      <Living />
      <Garage />
      <Utility />
      <Bedroom />
      <Kids />
      <Hallway />
      <Garden />
      <Driveway />
    </group>
  );
}

export const Props = memo(PropsImpl);
