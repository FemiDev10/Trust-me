import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Robot } from './robotImpl.js';
import {
  DOCK_PADS, DOCK_ROOM, FACE_CAMERA_Y, ROOMS_LAYOUT, TABLE_CENTER, WORK_POINTS,
  planPath, roomAt, robotSlot,
} from '../layout.js';

// Robots live in the house like a busy dollhouse:
//  - room changes → they WALK there through doorways + the hallway (pose 'walk')
//  - in their room they potter between work points (sink, desk, bins…), work there,
//    sometimes pause and look around, chat to a neighbour, hop, or pop into the hallway
//  - unplugged → 'off' on the kitchen dock; sitting out → 'sad' on the dock
// All motion runs in useFrame on refs; React only re-renders when a robot's pose changes.
// Purely visual: never touches game state.

const ORDER = ['BOLT', 'MOCHI', 'PIP', 'JUNO'];
const TRAVEL_SPEED = 3.1; // room → room (units / s)
const POTTER_SPEED = 1.35; // inside a room
const DOCK_Y = 0.1;
/** Robots are scaled up in the diorama so the characters read at a glance. */
export const ROBOT_SCALE = 2.3;
/** Docked (unplugged / sitting out) robots slump a little smaller so 5 fit on the dock. */
const DOCK_SCALE = 0.75;
/** Name-tag anchor height, in robot-local units (feet = 0, ~1 tall). */
const TAG_Y = 1.18;
/** robotLook poses that freeze ambient pottering (the robot stays put and plays the pose). */
const HOLD_POSES = new Set(['talk', 'sad', 'off', 'celebrate', 'walk']);

const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const faceTo = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);

function seededRng(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Resolve every robot to { room, pos, onDock, assigned }. Exported for tests. */
export function computePlacements(robots, gatherAtTable = false) {
  const counts = {};
  return robots.map((r, i) => {
    const castIdx = ORDER.indexOf(r.id) >= 0 ? ORDER.indexOf(r.id) : i;
    if (r.status === 'unplugged' || r.status === 'sittingOut') {
      return { id: r.id, room: DOCK_ROOM, pos: DOCK_PADS[castIdx % DOCK_PADS.length], onDock: true, assigned: false };
    }
    const wanted = gatherAtTable ? null : r.room ?? r.roomId;
    const room = wanted && ROOMS_LAYOUT[wanted] ? wanted : 'kitchen';
    counts[room] = (counts[room] ?? -1) + 1;
    return { id: r.id, room, pos: robotSlot(room, counts[room]), onDock: false, assigned: Boolean(wanted) };
  });
}

function RobotActor({
  id, room, pos, onDock, assigned, basePose, lookPose, expression, reveal, selected, dimmed,
  delay, intro, introPos, watched, shared, onRobotClick,
}) {
  const group = useRef();
  const sim = useRef(null);
  const [tx, tz] = pos;
  const [pose, setPose] = useState('idle');

  if (!sim.current) {
    const fromTable = Boolean(intro && introPos);
    const start = fromTable ? introPos : [tx, tz];
    sim.current = {
      x: start[0], z: start[1], y: onDock ? DOCK_Y : 0, sc: onDock ? DOCK_SCALE : 1,
      rotY: FACE_CAMERA_Y, lookY: FACE_CAMERA_Y, room: fromTable ? 'kitchen' : room, wasDock: onDock,
      path: [], speed: TRAVEL_SPEED, wait: 0, travelling: false, introWait: fromTable ? 1.2 : 0,
      job: null, t: 0, queue: [], look: null, rng: seededRng(id), reserved: null, shownPose: 'idle',
    };
  }

  // latest props for the frame loop, without re-creating it
  const live = useRef({});
  live.current = { room, tx, tz, onDock, assigned, basePose, lookPose, watched };

  const release = () => {
    const s = sim.current;
    const res = shared.current.reserved;
    if (s.reserved && res[s.reserved] === id) delete res[s.reserved];
    s.reserved = null;
  };

  // room change (or dock change) → travel there. A new slot in the same room is left
  // to the life loop so pottering isn't interrupted.
  useEffect(() => {
    const s = sim.current;
    const dockChange = s.wasDock !== onDock;
    s.wasDock = onDock;
    if (!s.travelling && s.room === room && !dockChange) return;
    if (!s.travelling && Math.hypot(s.x - tx, s.z - tz) < 0.01) { s.room = room; return; }
    release();
    const from = roomAt(s.x, s.z) ?? s.room;
    s.path = planPath([s.x, s.z], from, room, [tx, tz]);
    s.room = room;
    s.speed = TRAVEL_SPEED;
    s.travelling = true;
    s.job = null;
    s.queue = [];
    s.wait = Math.max(s.wait, s.introWait + delay * (s.introWait ? 2.2 : 1));
    s.introWait = 0;
  }, [room, tx, tz, delay, onDock]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => {
    release();
    const sh = shared.current;
    if (sh.anchors) delete sh.anchors[`robot:${id}`];
    delete sh.rooms[id];
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- ambient life -------------------------------------------------------
  const pickPoint = (s, L) => {
    const pts = WORK_POINTS[L.room] ?? [];
    const res = shared.current.reserved;
    const free = [];
    pts.forEach((p, i) => { const k = `${L.room}:${i}`; if ((!res[k] || res[k] === id) && k !== s.reserved) free.push([p, k]); });
    if (!free.length) return null;
    const [p, k] = free[Math.floor(s.rng() * free.length)];
    release();
    res[k] = id;
    s.reserved = k;
    return p;
  };

  const neighbour = (s) => {
    const { rooms, positions: P } = shared.current;
    let best = null, bd = 3.2;
    for (const other in rooms) {
      if (other === id || rooms[other] !== s.room || !P?.[other]) continue;
      const d = Math.hypot(P[other][0] - s.x, P[other][1] - s.z);
      if (d < bd) { bd = d; best = P[other]; }
    }
    return best;
  };

  const nextJob = (s, L) => {
    const r = s.rng;
    const lastWasWork = s.job === 'work';
    s.job = null;
    if (s.queue.length) { s.queue.shift()(); return; }

    if (!L.assigned) {
      // gathered at the kitchen table: hold the slot, chat, glance around
      if (Math.hypot(s.x - L.tx, s.z - L.tz) > 0.05) {
        s.path = [[L.tx, L.tz]]; s.speed = POTTER_SPEED; s.job = 'home'; return;
      }
      const n = r() < 0.35 ? neighbour(s) : null;
      if (n) { s.job = 'talk'; s.t = 1.4 + r(); s.lookY = faceTo(s.x, s.z, n[0], n[1]); return; }
      s.job = 'idle'; s.t = 1.5 + r() * 2.5;
      s.lookY = r() < 0.6 ? FACE_CAMERA_Y : faceTo(s.x, s.z, TABLE_CENTER[0], TABLE_CENTER[1]);
      return;
    }

    const idleChance = L.watched ? 0.06 : 0.28;
    const roll = r();
    if (lastWasWork && roll < 0.08) { s.job = 'hop'; s.t = 0.9; return; }
    if (lastWasWork && roll < 0.08 + idleChance) { s.job = 'idle'; s.t = 1.2 + r() * 1.6; s.lookY = s.rotY; return; }
    if (roll < 0.08 + idleChance + 0.1) {
      const n = neighbour(s);
      if (n) { s.job = 'talk'; s.t = 1.5; s.lookY = faceTo(s.x, s.z, n[0], n[1]); return; }
    }
    if (!L.watched && L.room !== 'hallway' && roll > 0.95) {
      // pop out to the hallway and back
      const R = ROOMS_LAYOUT[L.room];
      const hall = [R.hall[0] + (r() - 0.5) * 1.6, (r() - 0.5) * 0.5];
      release();
      s.path = planPath([s.x, s.z], L.room, 'hallway', hall);
      s.speed = POTTER_SPEED * 1.3;
      s.job = 'goto-hall';
      s.queue.push(() => { s.job = 'idle'; s.t = 0.8 + r(); s.lookY = FACE_CAMERA_Y; });
      s.queue.push(() => {
        const p = pickPoint(s, L) ?? [L.tx, L.tz, L.tx, L.tz + 1];
        s.path = planPath([s.x, s.z], 'hallway', L.room, [p[0], p[1]]);
        s.speed = POTTER_SPEED * 1.3; s.job = 'goto'; s.look = [p[2], p[3]];
      });
      return;
    }
    const p = pickPoint(s, L);
    if (p) { s.path = [[p[0], p[1]]]; s.speed = POTTER_SPEED; s.job = 'goto'; s.look = [p[2], p[3]]; return; }
    s.job = 'idle'; s.t = 1 + r() * 2; s.lookY = FACE_CAMERA_Y;
  };

  useFrame((state, rawDt) => {
    const s = sim.current;
    const g = group.current;
    const L = live.current;
    if (!g) return;
    const dt = Math.min(rawDt, 0.25); // keeps real-time pace even on a slow frame
    const now = state.clock.elapsedTime;
    const held = Boolean(L.lookPose && HOLD_POSES.has(L.lookPose));
    let moving = false;

    if (s.path.length && (s.travelling || !held)) {
      if (s.wait > 0) s.wait -= dt;
      else {
        let step = s.speed * dt;
        while (step > 0 && s.path.length) {
          const [px, pz] = s.path[0];
          const dx = px - s.x, dz = pz - s.z;
          const dist = Math.hypot(dx, dz);
          if (dist <= step) { s.x = px; s.z = pz; step -= dist; s.path.shift(); }
          else { s.x += (dx / dist) * step; s.z += (dz / dist) * step; step = 0; }
        }
        moving = s.path.length > 0;
        if (!moving) {
          if (s.travelling) {
            s.travelling = false;
            s.job = 'idle'; s.t = 0.4 + s.rng() * 1.0; s.lookY = FACE_CAMERA_Y;
          } else if (s.job === 'goto') {
            s.job = 'work';
            s.t = (L.watched ? 3 : 2) + s.rng() * 3;
            s.lookY = s.look ? faceTo(s.x, s.z, s.look[0], s.look[1]) : FACE_CAMERA_Y;
          } else {
            s.job = null; s.t = 0; // goto-hall / home → queue or next job
          }
        }
      }
    } else if (L.onDock && !s.path.length) {
      s.lookY = FACE_CAMERA_Y;
    } else if (!held && !s.travelling) {
      s.t -= dt;
      if (s.t <= 0 || !s.job) nextJob(s, L);
    }

    let targetRot;
    if (moving) targetRot = faceTo(s.x, s.z, s.path[0][0], s.path[0][1]);
    else if (s.path.length && s.wait > 0) targetRot = faceTo(s.x, s.z, s.path[0][0], s.path[0][1]);
    else if (s.job === 'idle' && L.assigned) targetRot = s.lookY + Math.sin(now * 1.3 + s.x) * 0.55;
    else targetRot = s.lookY;

    // pose: walking wins while moving; then robotLook; then dock; then the current job
    let p;
    if (moving) p = 'walk';
    else if (L.lookPose) p = L.lookPose;
    else if (L.onDock && !s.path.length) p = L.basePose;
    else if (s.job === 'work') p = 'work';
    else if (s.job === 'talk') p = 'talk';
    else if (s.job === 'hop') p = 'celebrate';
    else p = 'idle';
    if (p !== s.shownPose) { s.shownPose = p; setPose(p); }

    const dockNow = L.onDock && !s.path.length;
    s.y += ((dockNow ? DOCK_Y : 0) - s.y) * Math.min(1, dt * 8);
    s.sc += ((dockNow ? DOCK_SCALE : 1) - s.sc) * Math.min(1, dt * 6);
    s.rotY += wrapAngle(targetRot - s.rotY) * Math.min(1, dt * (moving ? 12 : 5));
    const sc = ROBOT_SCALE * s.sc;
    g.position.set(s.x, s.y, s.z);
    g.rotation.y = s.rotY;
    g.scale.setScalar(sc);

    const sh = shared.current;
    if (sh.positions) {
      const pp = sh.positions[id] ?? (sh.positions[id] = [0, 0]);
      pp[0] = s.x; pp[1] = s.z;
    }
    sh.rooms[id] = s.travelling || L.onDock ? null : s.room;
    if (sh.anchors) {
      const a = sh.anchors[`robot:${id}`] ?? (sh.anchors[`robot:${id}`] = [0, 0, 0]);
      a[0] = s.x; a[1] = s.y + TAG_Y * sc; a[2] = s.z;
    }
  });

  return (
    <group ref={group}>
      <Robot
        id={id}
        pose={pose}
        expression={expression}
        reveal={reveal}
        selected={selected}
        dimmed={dimmed}
        onClick={onRobotClick ? () => onRobotClick(id) : undefined}
      />
    </group>
  );
}

const MemoActor = memo(RobotActor);

/**
 * gatherAtTable: everyone (active) stands at the kitchen table (e.g. the task briefing).
 * introWalk: on mount, assigned robots start at the table and walk out to their rooms.
 */
export function Robots({
  robots = [], robotLook = {}, focusRobotId, playerRoom, positions, anchors, onRobotClick,
  gatherAtTable = false, introWalk = true,
}) {
  const placements = useMemo(() => computePlacements(robots, gatherAtTable), [robots, gatherAtTable]);
  const tablePlacements = useMemo(() => computePlacements(robots, true), [robots]);
  // shared, mutable per-frame data (never triggers renders)
  const shared = useRef(null);
  if (!shared.current) shared.current = { reserved: {}, rooms: {}, positions: null, anchors: null };
  shared.current.positions = positions?.current ?? null;
  shared.current.anchors = anchors?.current ?? null;

  return (
    <group>
      {robots.map((r, i) => {
        const p = placements[i];
        const look = robotLook?.[r.id] ?? {};
        const defaultPose = r.status === 'unplugged' ? 'off' : r.status === 'sittingOut' ? 'sad' : 'idle';
        const defaultExpr = r.status === 'unplugged' ? 'sleepy' : r.status === 'sittingOut' ? 'worried' : 'neutral';
        return (
          <MemoActor
            key={r.id}
            id={r.id}
            room={p.room}
            pos={p.pos}
            onDock={p.onDock}
            assigned={p.assigned}
            basePose={defaultPose}
            lookPose={look.pose}
            expression={look.expression ?? defaultExpr}
            reveal={Boolean(look.reveal)}
            selected={focusRobotId === r.id}
            dimmed={Boolean(look.dimmed)}
            delay={i * 0.18}
            intro={introWalk && p.assigned && !p.onDock}
            introPos={tablePlacements[i]?.pos}
            watched={Boolean(playerRoom && p.assigned && p.room === playerRoom)}
            shared={shared}
            onRobotClick={onRobotClick}
          />
        );
      })}
    </group>
  );
}
