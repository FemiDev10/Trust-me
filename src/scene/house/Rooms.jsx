import { memo, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { ROOMS_LAYOUT, ROOM_IDS } from '../layout.js';
import { floorTexture } from './materials.js';

// Room floors (the click targets), cyan active outline + hover glow, and name pills.

export const AI_CYAN = new THREE.Color('#3EE6E0');

const FLOORS = {
  kitchen: ['check', ['#ebdfc8', '#c7d2b6', '#b6a98f'], 1.1],
  security: ['carpet', ['#2a464d', '#203b41', '#35545b'], 2],
  office: ['wood', ['#8f5d3d', '#825436', '#5c3a25'], 2.6],
  living: ['wood', ['#c99566', '#bb875b', '#8f6440'], 2.6],
  garage: ['concrete', ['#8e959a', '#7d848a', '#697177'], 2.5],
  bedroom: ['carpet', ['#c9978f', '#b98680', '#d9aaa2'], 2],
  kids: ['check', ['#f2d586', '#9ccbe6', '#e0c07a'], 1.2],
  hallway: ['herring', ['#a67a52', '#936946', '#6b4a33'], 1.6],
  utility: ['tile', ['#bccbcd', '#abbcc0', '#8ea2a7'], 1.2],
  garden: ['grass', ['#5f9e4a', '#57933f', '#7bb95f'], 3.2],
};

function frameGeometry(w, d, inset = 0.14, band = 0.09) {
  const hw = w / 2 - inset, hd = d / 2 - inset;
  const shape = new THREE.Shape();
  shape.moveTo(-hw, -hd); shape.lineTo(hw, -hd); shape.lineTo(hw, hd); shape.lineTo(-hw, hd); shape.lineTo(-hw, -hd);
  const hole = new THREE.Path();
  const iw = hw - band, id = hd - band;
  hole.moveTo(-iw, -id); hole.lineTo(-iw, id); hole.lineTo(iw, id); hole.lineTo(iw, -id); hole.lineTo(-iw, -id);
  shape.holes.push(hole);
  const g = new THREE.ShapeGeometry(shape);
  g.rotateX(-Math.PI / 2);
  return g;
}

function Room({ id, active, hovered, setHovered, onRoomClick }) {
  const L = ROOMS_LAYOUT[id];
  const [x0, x1, z0, z1] = L.rect;
  const w = x1 - x0, d = z1 - z0;
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const [style, colors, tile] = FLOORS[id];

  const floorMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: floorTexture(style, colors, [w / tile, d / tile]),
    roughness: style === 'wood' || style === 'herring' ? 0.55 : 0.85,
    emissive: AI_CYAN, emissiveIntensity: 0,
  }), [style, colors, w, d, tile]);
  const frameGeo = useMemo(() => frameGeometry(w, d), [w, d]);
  const frameMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: AI_CYAN, transparent: true, opacity: 0, depthWrite: false, toneMapped: false,
  }), []);
  useEffect(() => () => { floorMat.map?.dispose(); floorMat.dispose(); frameGeo.dispose(); frameMat.dispose(); }, [floorMat, frameGeo, frameMat]);

  const glow = useRef(0);
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    const pulse = 0.5 + 0.5 * Math.sin(t * 2.4 + cx * 0.3);
    const target = hovered ? 0.5 + 0.08 * pulse : active ? 0.035 + 0.035 * pulse : 0;
    glow.current += (target - glow.current) * Math.min(1, dt * 10);
    floorMat.emissiveIntensity = glow.current;
    frameMat.opacity = active ? (hovered ? 1 : 0.45 + 0.4 * pulse) : Math.max(0, frameMat.opacity - dt * 3);
    frameMat.visible = frameMat.opacity > 0.01;
  });

  const handlers = active ? {
    onPointerOver: (e) => { e.stopPropagation(); setHovered(id); },
    onPointerOut: () => setHovered((h) => (h === id ? null : h)),
    onClick: (e) => { e.stopPropagation(); onRoomClick?.(id); },
  } : {};

  return (
    <group>
      <mesh position={[cx, -0.03, cz]} scale={[w, 0.06, d]} material={floorMat} receiveShadow {...handlers}>
        <boxGeometry />
      </mesh>
      <mesh geometry={frameGeo} material={frameMat} position={[cx, 0.03, cz]} renderOrder={2} />
    </group>
  );
}

const MemoRoom = memo(Room);

export function Rooms({ activeSet, hovered, setHovered, onRoomClick }) {
  // keep the latest click handler without re-rendering rooms
  const clickRef = useRef(onRoomClick);
  clickRef.current = onRoomClick;
  const stableClick = useMemo(() => (id) => clickRef.current?.(id), []);

  useEffect(() => {
    document.body.style.cursor = hovered && activeSet.has(hovered) ? 'pointer' : '';
  }, [hovered, activeSet]);
  useEffect(() => () => { document.body.style.cursor = ''; }, []);
  // drop hover if the room stops being active
  useEffect(() => { if (hovered && !activeSet.has(hovered)) setHovered(null); }, [hovered, activeSet, setHovered]);

  return (
    <group>
      {ROOM_IDS.map((id) => (
        <MemoRoom
          key={id}
          id={id}
          active={activeSet.has(id)}
          hovered={hovered === id}
          setHovered={setHovered}
          onRoomClick={stableClick}
        />
      ))}
    </group>
  );
}
