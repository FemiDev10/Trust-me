import { GEO, mat, roundedBoxGeo } from './materials.js';

// Tiny prop vocabulary. `at` is the BOTTOM-centre of the shape ([x, y, z]),
// which makes stacking toy furniture on a floor trivial.

/** Rounded box. s = [w, h, d], r = bevel radius, c = colour or material. */
export function B({ s, at = [0, 0, 0], r = 0.06, c = '#ddd', m, rot, shadow = true, ...rest }) {
  const [w, h, d] = s;
  return (
    <mesh
      geometry={roundedBoxGeo(w, h, d, r)}
      material={m ?? mat(c)}
      position={[at[0], at[1] + h / 2, at[2]]}
      rotation={rot}
      castShadow={shadow}
      receiveShadow
      {...rest}
    />
  );
}

/** Cylinder: radius r, height h. */
export function Cyl({ r = 0.2, h = 0.4, at = [0, 0, 0], c = '#ddd', m, rot, shadow = true, ...rest }) {
  return (
    <mesh
      geometry={GEO.cyl}
      material={m ?? mat(c)}
      position={[at[0], at[1] + (rot ? 0 : h / 2), at[2]]}
      rotation={rot}
      scale={[r, h, r]}
      castShadow={shadow}
      receiveShadow
      {...rest}
    />
  );
}

/** Sphere / ellipsoid centred at `at` (not bottom). */
export function Ball({ r = 0.2, sc, at = [0, 0, 0], c = '#ddd', m, shadow = true, ...rest }) {
  return (
    <mesh
      geometry={GEO.sphere}
      material={m ?? mat(c)}
      position={at}
      scale={sc ?? [r, r, r]}
      castShadow={shadow}
      receiveShadow
      {...rest}
    />
  );
}

/** Flat decal-ish plane lying on the floor (rugs, stains, mats). */
export function Rug({ s = [1, 1], at = [0, 0.012, 0], c = '#aa6644', m, rot = 0, round = false }) {
  if (round) {
    return (
      <mesh position={[at[0], at[1], at[2]]} rotation={[-Math.PI / 2, 0, rot]} material={m ?? mat(c, { rough: 0.95 })} receiveShadow>
        <circleGeometry args={[s[0] / 2, 40]} />
      </mesh>
    );
  }
  return (
    <mesh position={[at[0], at[1] + 0.012, at[2]]} rotation={[0, rot, 0]} geometry={roundedBoxGeo(s[0], 0.024, s[1], 0.012)} material={m ?? mat(c, { rough: 0.95 })} receiveShadow />
  );
}
