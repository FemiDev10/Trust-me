import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { ROOMS } from '../../engine/data/rooms.js';
import { ROOMS_LAYOUT, ROOM_IDS } from '../layout.js';

// Room-name pills + the YOU pill as plain DOM over the canvas (one layer, no portals).
// <LabelProjector/> (inside the Canvas) moves them every frame by projecting 3D anchors.
// Cheaper and more robust than one drei <Html> React root per label.

const NAMES = Object.fromEntries(ROOMS.map((r) => [r.id, r.name]));
const v = new THREE.Vector3();

const TAG_GAP = 3; // px between stacked robot tags

/**
 * anchors: ref to { [key]: [x, y, z] | null }; els: ref to { [key]: HTMLElement }
 * Robot tags ("robot:ID") are de-cluttered in screen space: when two overlap, the one
 * further back is nudged up so they stack instead of piling on top of each other.
 */
export function LabelProjector({ anchors, els }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const tags = useRef([]);
  const frame = useRef(0);
  useFrame((_, dt) => {
    const A = anchors.current;
    const E = els.current;
    const list = tags.current;
    list.length = 0;
    const measure = frame.current++ % 20 === 0;
    for (const key in E) {
      const el = E[key];
      if (!el) continue;
      const a = A[key];
      if (!a) { if (el.style.opacity !== '0') el.style.opacity = '0'; continue; }
      v.set(a[0], a[1], a[2]).project(camera);
      const x = ((v.x + 1) / 2) * size.width;
      const y = ((1 - v.y) / 2) * size.height;
      if (key.startsWith('robot:')) {
        if (measure || !el._hsW) { el._hsW = el.offsetWidth || 50; el._hsH = el.offsetHeight || 18; }
        list.push({ el, x, y, ty: y, w: el._hsW, h: el._hsH });
        continue;
      }
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      if (el.style.opacity !== '1') el.style.opacity = '1';
    }
    // front-most (lowest on screen) keeps its spot; others stack upwards out of the way
    list.sort((p, q) => q.y - p.y);
    for (let i = 1; i < list.length; i++) {
      const t = list[i];
      for (let pass = 0; pass < 6; pass++) {
        let moved = false;
        for (let j = 0; j < i; j++) {
          const o = list[j];
          if (Math.abs(t.x - o.x) < (t.w + o.w) / 2 + TAG_GAP && Math.abs(t.ty - o.ty) < (t.h + o.h) / 2 + TAG_GAP) {
            t.ty = o.ty - (t.h + o.h) / 2 - TAG_GAP;
            moved = true;
          }
        }
        if (!moved) break;
      }
    }
    const k = Math.min(1, dt * 12);
    for (const t of list) {
      const target = t.ty - t.y;
      t.el._hsOff = (t.el._hsOff ?? target) + (target - (t.el._hsOff ?? target)) * k;
      const y = t.y + t.el._hsOff;
      t.el.style.transform = `translate3d(${t.x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      if (t.el.style.opacity !== '1') t.el.style.opacity = '1';
    }
  });
  return null;
}

/** Static anchors for every room label. */
export function roomLabelAnchors() {
  return Object.fromEntries(ROOM_IDS.map((id) => [id, ROOMS_LAYOUT[id].label]));
}

const ROBOT_HEX = { BOLT: '#F5C518', MOCHI: '#FF8FB8', ZIGGY: '#4CC38A', PIP: '#4A90E2', JUNO: '#9B6BFF' };

export function LabelLayer({ els, activeSet, hovered, setHovered, playerRoom, onRoomClick, robots = [], focusRobotId }) {
  const clickRef = useRef(onRoomClick);
  clickRef.current = onRoomClick;
  return (
    <div className="hs-labels">
      {ROOM_IDS.map((id) => {
        const active = activeSet.has(id);
        const isHover = hovered === id;
        return (
          <div
            key={id}
            ref={(el) => { els.current[id] = el; }}
            className="hs-anchor"
            style={{ opacity: 0 }}
          >
            <div
              className={`hs-label${active ? ' is-active' : ''}${isHover ? ' is-hover' : ''}${playerRoom === id ? ' is-player' : ''}`}
              style={{ pointerEvents: active ? 'auto' : 'none' }}
              onPointerEnter={active ? () => setHovered(id) : undefined}
              onPointerLeave={active ? () => setHovered((h) => (h === id ? null : h)) : undefined}
              onClick={active ? () => clickRef.current?.(id) : undefined}
            >
              {playerRoom === id && <span className="hs-label__you">YOU</span>}
              <span>{NAMES[id] ?? id}</span>
            </div>
          </div>
        );
      })}
      {robots.map((r) => {
        const key = `robot:${r.id}`;
        const off = r.status === 'unplugged';
        const room = r.room ?? r.roomId;
        const watched = r.status !== 'unplugged' && r.status !== 'sittingOut'
          && Boolean(r.watched || (playerRoom && room === playerRoom));
        return (
          <div key={key} ref={(el) => { if (el) els.current[key] = el; else delete els.current[key]; }} className="hs-anchor hs-anchor--tag" style={{ opacity: 0 }}>
            <div
              className={`hs-tag${off ? ' is-off' : ''}${r.status === 'sittingOut' ? ' is-out' : ''}${focusRobotId === r.id ? ' is-focus' : ''}${watched ? ' is-watched' : ''}`}
              style={{ '--tag': r.hex ?? ROBOT_HEX[r.id] ?? '#cfd8d8' }}
            >
              {r.name ?? r.id}
              {watched && <span className="hs-tag__watched" aria-label="watched">👁 WATCHED</span>}
            </div>
          </div>
        );
      })}
      <div ref={(el) => { els.current.you = el; }} className="hs-anchor hs-anchor--you" style={{ opacity: 0 }}>
        <div className="hs-you"><span className="hs-you__dot" />YOU</div>
      </div>
    </div>
  );
}
