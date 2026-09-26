import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import { BOUNDS, CAMERA, ROOMS_LAYOUT } from '../layout.js';

// Fixed isometric orthographic camera. Auto-fits the whole house to the viewport
// (minus optional HUD insets, in px), with a gentle nudge toward the focus robot /
// player room. No orbit.

function basis(azimuth) {
  const DIR = new THREE.Vector3(
    Math.sin(azimuth) * Math.cos(CAMERA.elevation),
    Math.sin(CAMERA.elevation),
    Math.cos(azimuth) * Math.cos(CAMERA.elevation),
  ).normalize();
  const FWD = DIR.clone().negate();
  const RIGHT = new THREE.Vector3().crossVectors(FWD, new THREE.Vector3(0, 1, 0)).normalize();
  const UP = new THREE.Vector3().crossVectors(RIGHT, FWD).normalize();
  // projected extents of the house in camera-plane units + the ground point that centres it
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  const p = new THREE.Vector3();
  for (const x of [BOUNDS.x0, BOUNDS.x1]) for (const y of [BOUNDS.y0, BOUNDS.y1]) for (const z of [BOUNDS.z0, BOUNDS.z1]) {
    p.set(x, y, z);
    const sx = p.dot(RIGHT), sy = p.dot(UP);
    minX = Math.min(minX, sx); maxX = Math.max(maxX, sx);
    minY = Math.min(minY, sy); maxY = Math.max(maxY, sy);
  }
  const onPlane = RIGHT.clone().multiplyScalar((minX + maxX) / 2).add(UP.clone().multiplyScalar((minY + maxY) / 2));
  const center = onPlane.add(DIR.clone().multiplyScalar(-onPlane.y / DIR.y));
  return { DIR, RIGHT, UP, w: maxX - minX, h: maxY - minY, center };
}

// Landscape: long side of the house runs across the screen. Portrait (phones): rotate
// the view so the house runs down the screen instead.
const LANDSCAPE = basis(CAMERA.azimuth);
const PORTRAIT = basis(CAMERA.portraitAzimuth);

const tmpV = new THREE.Vector3();

export function CameraRig({ focusRobotId, playerRoom, positions, insets }) {
  const cam = useRef();
  const size = useThree((s) => s.size);
  const st = useRef({ target: LANDSCAPE.center.clone(), zoom: 0, init: false, key: '' });

  useFrame((_, dt) => {
    const c = cam.current;
    if (!c) return;
    const ins = { top: 0, right: 0, bottom: 0, left: 0, ...insets };
    const fit = size.width / Math.max(1, size.height) < 0.85 ? PORTRAIT : LANDSCAPE;
    const { DIR, RIGHT, UP } = fit;
    const availW = Math.max(100, size.width - ins.left - ins.right);
    const availH = Math.max(100, size.height - ins.top - ins.bottom);
    const pad = size.width < 700 ? 1.02 : 1.06;
    const baseZoom = Math.min(availW / (fit.w * pad), availH / (fit.h * pad));

    // gentle nudge: 12% toward focus robot (or 7% toward player room), tiny zoom-in
    let nx = 0, nz = 0, zoomMul = 1;
    const fp = focusRobotId ? positions.current[focusRobotId] : null;
    if (fp) {
      nx = (fp[0] - fit.center.x) * 0.12; nz = (fp[1] - fit.center.z) * 0.12; zoomMul = 1.07;
    } else if (playerRoom && ROOMS_LAYOUT[playerRoom]) {
      const p = ROOMS_LAYOUT[playerRoom].player;
      nx = (p[0] - fit.center.x) * 0.07; nz = (p[1] - fit.center.z) * 0.07; zoomMul = 1.025;
    }
    // shift so the house centres inside the inset area (screen px → world units)
    const offX = (ins.right - ins.left) / 2 / (baseZoom * zoomMul);
    const offY = (ins.top - ins.bottom) / 2 / (baseZoom * zoomMul);
    tmpV.copy(fit.center).add(new THREE.Vector3(nx, 0, nz))
      .addScaledVector(RIGHT, offX).addScaledVector(UP, offY);

    const s = st.current;
    // snap on first frame / viewport change / orientation flip, glide otherwise
    const key = `${size.width}x${size.height}`;
    const k = s.init && s.key === key ? 1 - Math.exp(-dt * 2.2) : 1;
    s.init = true;
    s.key = key;
    s.target.lerp(tmpV, k);
    s.zoom += (baseZoom * zoomMul - s.zoom) * k;

    c.position.copy(s.target).addScaledVector(DIR, CAMERA.distance);
    c.up.set(0, 1, 0);
    c.lookAt(s.target);
    if (Math.abs(c.zoom - s.zoom) > 1e-4) { c.zoom = s.zoom; c.updateProjectionMatrix(); }
  });

  return <OrthographicCamera ref={cam} makeDefault near={1} far={140} position={[20, 30, 40]} zoom={20} />;
}
