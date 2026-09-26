import { memo, useMemo } from 'react';
import { buildWallSegments, BOUNDS } from '../layout.js';
import { GEO, mat, roundedBoxGeo } from './materials.js';

// Dollhouse cut-away walls: cream plaster with a dark "cut" cap on top,
// plus the floating plinth the whole diorama sits on.

const WALL = mat('#efe4d2', { rough: 0.85 });
const CAP = mat('#2a2421', { rough: 0.7 });
const SKIRT = mat('#d9c9b0', { rough: 0.8 });

function WallsImpl() {
  const segs = useMemo(() => buildWallSegments(), []);
  return (
    <group>
      {segs.map((s, i) => (
        <group key={i} position={[s.x, 0, s.z]} rotation={[0, s.rotY, 0]}>
          <mesh geometry={GEO.box} material={WALL} position={[0, s.h / 2, 0]} scale={[s.len, s.h, s.t]} castShadow receiveShadow />
          <mesh geometry={GEO.box} material={SKIRT} position={[0, 0.05, 0]} scale={[s.len + 0.001, 0.1, s.t + 0.03]} receiveShadow />
          <mesh geometry={GEO.box} material={CAP} position={[0, s.h + 0.015, 0]} scale={[s.len + 0.01, 0.03, s.t + 0.02]} />
        </group>
      ))}
    </group>
  );
}

export const Walls = memo(WallsImpl);

/** The floating slab (and a soft underside) everything sits on. */
function PlinthImpl() {
  const x0 = -14.35, x1 = 15.35, z0 = -7.35, z1 = 6.35;
  const w = x1 - x0, d = z1 - z0;
  return (
    <group>
      <mesh
        geometry={roundedBoxGeo(w, 0.5, d, 0.18)}
        material={mat('#0e3d42', { rough: 0.9 })}
        position={[(x0 + x1) / 2, -0.31, (z0 + z1) / 2]}
        receiveShadow
      />
      {/* thin warm edge line: reads as a premium base trim */}
      <mesh
        geometry={roundedBoxGeo(w + 0.04, 0.04, d + 0.04, 0.02)}
        material={mat('#16545a', { emissive: '#3ee6e0', ei: 0.12 })}
        position={[(x0 + x1) / 2, -0.09, (z0 + z1) / 2]}
      />
      {/* neighbour's slab, a step lower */}
      <mesh
        geometry={roundedBoxGeo(BOUNDS.x1 - 15.45, 0.4, d + 0.4, 0.14)}
        material={mat('#0b3337', { rough: 0.9 })}
        position={[(15.45 + BOUNDS.x1) / 2, -0.28, (z0 + z1) / 2]}
        receiveShadow
      />
    </group>
  );
}

export const Plinth = memo(PlinthImpl);
