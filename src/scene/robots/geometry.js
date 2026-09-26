// Shared, cached geometries for the robot cast.
// Every geometry is created once per unique key and reused by all robot instances.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const cache = new Map();
function G(key, make) {
  let g = cache.get(key);
  if (!g) {
    g = make();
    cache.set(key, g);
  }
  return g;
}

const TAU = Math.PI * 2;

export const sphere = () => G('sphere', () => new THREE.SphereGeometry(1, 32, 24));
export const sphereLo = () => G('sphereLo', () => new THREE.SphereGeometry(1, 16, 12));
// Upper / lower hemispheres, used as eyelid shells that rotate over the eye plate.
export const hemiUp = () =>
  G('hemiUp', () => new THREE.SphereGeometry(1, 32, 12, 0, TAU, 0, Math.PI / 2));
export const hemiDown = () =>
  G('hemiDown', () => new THREE.SphereGeometry(1, 32, 12, 0, TAU, Math.PI / 2, Math.PI / 2));

/** Soft-bevel vinyl box (same geometry drei's <RoundedBox> builds, but cached and shared). */
export const rbox = (w, h, d, r, seg = 4) =>
  G(`rbox:${w}:${h}:${d}:${r}:${seg}`, () => new RoundedBoxGeometry(w, h, d, seg, r));

export const cyl = (rt, rb, h, seg = 28) =>
  G(`cyl:${rt}:${rb}:${h}:${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg));

export const capsule = (r, len) =>
  G(`cap:${r}:${len}`, () => new THREE.CapsuleGeometry(r, len, 8, 20));

export const torus = (R, tube, arc = TAU, radial = 12, tubular = 48) =>
  G(`torus:${R}:${tube}:${arc}`, () => new THREE.TorusGeometry(R, tube, radial, tubular, arc));

export const ring = (inner, outer) =>
  G(`ring:${inner}:${outer}`, () => new THREE.RingGeometry(inner, outer, 64));

export const disc = (r) => G(`disc:${r}`, () => new THREE.CircleGeometry(r, 64));

export const cone = (r, h, seg = 20) => G(`cone:${r}:${h}`, () => new THREE.ConeGeometry(r, h, seg));

/** Lathe from [x,y] pairs, smoothed with a Catmull-Rom spline for a moulded vinyl look. */
export const lathe = (key, pts, segments = 40) =>
  G(`lathe:${key}`, () => {
    const curve = new THREE.SplineCurve(pts.map(([x, y]) => new THREE.Vector2(x, y)));
    return new THREE.LatheGeometry(curve.getPoints(48), segments);
  });

/** Zigzag band over the top of the head (ZIGGY's headphones). */
export const zigzagBand = (R, amp, teeth, thick) =>
  G(`zig:${R}:${amp}:${teeth}:${thick}`, () => {
    const pts = [];
    const n = teeth * 2;
    const a0 = Math.PI * 0.08;
    const a1 = Math.PI * 0.92;
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      const r = R + (i % 2 === 0 ? 0 : amp);
      pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0));
    }
    const path = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.05);
    return new THREE.TubeGeometry(path, 120, thick, 10, false);
  });

/** Lightning bolt (BOLT's antenna): an extruded, bevelled zigzag. */
export const boltShape = () =>
  G('bolt', () => {
    const s = new THREE.Shape();
    s.moveTo(0.02, 0.13);
    s.lineTo(-0.045, 0.0);
    s.lineTo(0.0, 0.0);
    s.lineTo(-0.025, -0.11);
    s.lineTo(0.05, 0.03);
    s.lineTo(0.008, 0.03);
    s.lineTo(0.04, 0.13);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, {
      depth: 0.025,
      bevelEnabled: true,
      bevelThickness: 0.008,
      bevelSize: 0.007,
      bevelSegments: 3,
    });
    g.center();
    return g;
  });

/** Flat band that hugs a rounded-rectangle cross-section (accent seam around boxy bodies). */
export const roundedRectBand = (w, d, r, thick, h) =>
  G(`rrband:${w}:${d}:${r}:${thick}:${h}`, () => {
    const rr = (s, W, D, R) => {
      const x = -W / 2;
      const y = -D / 2;
      s.moveTo(x + R, y);
      s.lineTo(x + W - R, y);
      s.quadraticCurveTo(x + W, y, x + W, y + R);
      s.lineTo(x + W, y + D - R);
      s.quadraticCurveTo(x + W, y + D, x + W - R, y + D);
      s.lineTo(x + R, y + D);
      s.quadraticCurveTo(x, y + D, x, y + D - R);
      s.lineTo(x, y + R);
      s.quadraticCurveTo(x, y, x + R, y);
      return s;
    };
    const outer = rr(new THREE.Shape(), w + thick * 2, d + thick * 2, r + thick);
    const inner = rr(new THREE.Path(), w, d, r);
    outer.holes.push(inner);
    const geo = new THREE.ExtrudeGeometry(outer, { depth: h, bevelEnabled: false, curveSegments: 10 });
    geo.translate(0, 0, -h / 2);
    geo.rotateX(-Math.PI / 2);
    return geo;
  });

/** Spherical cap centred on +Z (unit radius). Pupils and highlights hug the eye-plate sphere. */
export const capZ = (theta) =>
  G(`capZ:${theta}`, () => {
    const geo = new THREE.SphereGeometry(1, 28, 6, 0, TAU, 0, theta);
    geo.rotateX(Math.PI / 2);
    return geo;
  });
