import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// Shared materials + geometries so hundreds of props cost a handful of GPU programs.

const matCache = new Map();
/** Satin "vinyl toy" material, cached by colour + options. */
export function mat(color, { rough = 0.62, metal = 0, emissive, ei = 0, transparent = false, opacity = 1 } = {}) {
  const key = `${color}|${rough}|${metal}|${emissive}|${ei}|${opacity}`;
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color, roughness: rough, metalness: metal,
      emissive: emissive ?? '#000000', emissiveIntensity: ei,
      transparent: transparent || opacity < 1, opacity,
    });
    matCache.set(key, m);
  }
  return m;
}

const geoCache = new Map();
export function roundedBoxGeo(w, h, d, r = 0.06) {
  const rr = Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001);
  const key = `${w.toFixed(3)}|${h.toFixed(3)}|${d.toFixed(3)}|${rr.toFixed(3)}`;
  let g = geoCache.get(key);
  if (!g) {
    g = new RoundedBoxGeometry(w, h, d, 2, Math.max(rr, 0.005));
    geoCache.set(key, g);
  }
  return g;
}

export const GEO = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 24),
  sphere: new THREE.SphereGeometry(1, 24, 16),
  plane: new THREE.PlaneGeometry(1, 1),
  torus: new THREE.TorusGeometry(1, 0.08, 10, 48),
};

// Screens / bulbs whose glow follows the mood (Lighting mutates these).
export const MOOD_MATS = {
  screen: new THREE.MeshStandardMaterial({ color: '#0a2226', emissive: '#3ee6e0', emissiveIntensity: 1.4, roughness: 0.3 }),
  screenAlt: new THREE.MeshStandardMaterial({ color: '#0a2226', emissive: '#5be38c', emissiveIntensity: 1.2, roughness: 0.3 }),
  bulb: new THREE.MeshStandardMaterial({ color: '#fff1d0', emissive: '#ffc070', emissiveIntensity: 2.2, roughness: 0.4 }),
  window: new THREE.MeshStandardMaterial({ color: '#12353a', emissive: '#7fd8ff', emissiveIntensity: 0.25, roughness: 0.2 }),
};

// ---------------------------------------------------------------------------
// Procedural floor textures (canvas → CanvasTexture), cached per style.

const texCache = new Map();
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function draw(style, [a, b, c]) {
  const S = 256;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g = cv.getContext('2d');
  const r = rng(style.length * 97 + a.length);
  g.fillStyle = a;
  g.fillRect(0, 0, S, S);
  if (style === 'wood') {
    const rows = 6;
    for (let i = 0; i < rows; i++) {
      const y = (i * S) / rows;
      g.fillStyle = i % 2 ? a : b;
      g.fillRect(0, y, S, S / rows);
      const off = r() * S;
      g.fillStyle = c;
      g.fillRect(0, y, S, 2);
      g.fillRect(off, y, 2, S / rows);
      g.globalAlpha = 0.08;
      for (let k = 0; k < 6; k++) g.fillRect(0, y + 4 + r() * (S / rows - 8), S, 1);
      g.globalAlpha = 1;
    }
  } else if (style === 'tile' || style === 'check') {
    const n = style === 'check' ? 4 : 4;
    const s = S / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      g.fillStyle = style === 'check' ? ((i + j) % 2 ? a : b) : (r() > 0.5 ? a : b);
      g.fillRect(i * s, j * s, s, s);
    }
    g.fillStyle = c;
    for (let i = 0; i <= n; i++) { g.fillRect(i * s - 1.5, 0, 3, S); g.fillRect(0, i * s - 1.5, S, 3); }
  } else if (style === 'carpet') {
    for (let k = 0; k < 2400; k++) {
      g.fillStyle = r() > 0.5 ? b : c;
      g.globalAlpha = 0.18;
      g.fillRect(r() * S, r() * S, 2, 2);
    }
    g.globalAlpha = 1;
  } else if (style === 'concrete') {
    for (let k = 0; k < 1800; k++) {
      g.fillStyle = r() > 0.5 ? b : c;
      g.globalAlpha = 0.12;
      const z = 1 + r() * 3;
      g.fillRect(r() * S, r() * S, z, z);
    }
    g.globalAlpha = 0.5;
    g.fillStyle = c;
    g.fillRect(0, S / 2 - 1, S, 2);
    g.fillRect(S / 2 - 1, 0, 2, S);
    g.globalAlpha = 1;
  } else if (style === 'grass') {
    const stripes = 4;
    for (let i = 0; i < stripes; i++) {
      g.fillStyle = i % 2 ? a : b;
      g.fillRect(0, (i * S) / stripes, S, S / stripes);
    }
    for (let k = 0; k < 2600; k++) {
      g.fillStyle = c;
      g.globalAlpha = 0.25;
      g.fillRect(r() * S, r() * S, 1.5, 3);
    }
    g.globalAlpha = 1;
  } else if (style === 'herring') {
    const w = 32, h = 12;
    for (let y = -S; y < S * 2; y += h) for (let x = -S; x < S * 2; x += w) {
      g.save();
      g.translate(x + ((y / h) % 2) * (w / 2), y);
      g.fillStyle = r() > 0.5 ? a : b;
      g.fillRect(0, 0, w - 2, h - 2);
      g.restore();
    }
  }
  return cv;
}

/** Floor texture; `repeat` = tiles across [x, z]. Clone shares the image (cheap). */
export function floorTexture(style, colors, repeat = [1, 1]) {
  const key = `${style}|${colors.join(',')}`;
  let base = texCache.get(key);
  if (!base) {
    base = new THREE.CanvasTexture(draw(style, colors));
    base.colorSpace = THREE.SRGBColorSpace;
    base.wrapS = base.wrapT = THREE.RepeatWrapping;
    base.anisotropy = 8;
    texCache.set(key, base);
  }
  const t = base.clone();
  t.repeat.set(repeat[0], repeat[1]);
  t.needsUpdate = true;
  return t;
}

let poolTex;
/** Soft radial gradient used for fake warm light pools + glows (additive). */
export function radialTexture() {
  if (poolTex) return poolTex;
  const S = 128;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g = cv.getContext('2d');
  const grd = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.35, 'rgba(255,255,255,0.55)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, S, S);
  poolTex = new THREE.CanvasTexture(cv);
  return poolTex;
}
