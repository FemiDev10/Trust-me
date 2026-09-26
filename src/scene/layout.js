// House layout in world units (1 unit ≈ one robot height). Floor is y = 0.
// x runs left→right on screen, z runs back→front (the camera looks from +x/+z).
// Every room is an axis-aligned rectangle [x0, x1] × [z0, z1].
//
//   z=-7 ┌────────┬───────┬──────────────┬───────────────┐┌──────────┐
//        │ GARAGE │UTILITY│   KITCHEN    │  LIVING ROOM  ││          │
//   z=-1 │        ├───────┴──────────────┴───────────────┤│  GARDEN  │
//        │        ▯             HALLWAY                  ▯│ (outside)│ ← neighbour's fence
//   z= 1 └─ door ─┼────────┬────────┬─────────┬──────────┤│          │
//     (driveway)  │SECURITY│ OFFICE │ BEDROOM │ KIDS'RM  ││          │
//   z= 6          └────────┴────────┴─────────┴──────────┘└──────────┘
//              x=-14  -9       -5       -1        4         9         15

export const FLOOR_Y = 0;

/**
 * Per room:
 *  rect   [x0, x1, z0, z1]
 *  door   [x, z]  the doorway point on the wall (robots path through it)
 *  hall   [x, z]  the matching point on the hallway spine (z = 0)
 *  inside [x, z]  a point just inside the room behind the door
 *  slots  [[x, z] × 5] where robots stand (world coords), first = most visible
 *  player [x, z]  where the "YOU" marker stands
 *  label  [x, y, z] anchor for the room-name pill
 */
export const ROOMS_LAYOUT = {
  garage: {
    rect: [-14, -9, -7, 1],
    door: [-9, 0], hall: [-8.3, 0], inside: [-9.8, 0],
    slots: [[-10.1, -0.9], [-11.6, -0.3], [-10.2, 0.5], [-10.0, -2.5], [-12.2, -1.6]],
    player: [-12.3, 0.4],
    label: [-11.5, 2.5, -6.6],
  },
  utility: {
    rect: [-9, -5.5, -7, -1],
    door: [-7.25, -1], hall: [-7.25, 0], inside: [-7.25, -1.7],
    slots: [[-7.4, -3.4], [-8.2, -2.2], [-6.4, -2.3], [-8.1, -4.9], [-6.3, -4.4]],
    player: [-7.3, -1.6],
    label: [-7.25, 2.5, -6.6],
  },
  kitchen: {
    rect: [-5.5, 1.5, -7, -1],
    door: [0.3, -1], hall: [0.3, 0], inside: [0.3, -1.7],
    // around the meeting table (centre -2.4, -3.9)
    slots: [[-2.4, -1.8], [-0.6, -2.9], [-4.3, -3.0], [-0.7, -4.9], [-4.2, -4.9]],
    player: [0.35, -1.8],
    label: [-2, 2.5, -6.6],
  },
  living: {
    rect: [1.5, 9, -7, -1],
    door: [2.6, -1], hall: [2.6, 0], inside: [2.6, -1.7],
    slots: [[5.4, -2.2], [3.2, -3.4], [7.6, -2.4], [3.6, -1.9], [7.4, -4.0]],
    player: [2.3, -2.4],
    label: [5.25, 2.5, -6.6],
  },
  hallway: {
    rect: [-9, 9, -1, 1],
    door: [0, 0], hall: [0, 0], inside: [0, 0],
    slots: [[-6.6, 0.3], [-3.9, -0.3], [-1.1, 0.3], [4.0, -0.3], [6.8, 0.3]],
    player: [1.6, 0.1],
    label: [-5.25, 0.3, 0.1],
  },
  security: {
    rect: [-9, -5, 1, 6],
    door: [-6.0, 1], hall: [-6.0, 0], inside: [-6.0, 1.7],
    slots: [[-6.4, 3.4], [-7.9, 3.7], [-5.9, 4.9], [-7.3, 5.1], [-5.7, 2.4]],
    player: [-6.9, 2.3],
    label: [-7, 0.55, 5.6],
  },
  office: {
    rect: [-5, -1, 1, 6],
    door: [-2.0, 1], hall: [-2.0, 0], inside: [-2.0, 1.7],
    slots: [[-2.8, 3.4], [-3.6, 4.9], [-2.1, 4.8], [-3.7, 2.6], [-2.2, 2.4]],
    player: [-4.3, 5.5],
    label: [-3, 0.55, 5.6],
  },
  bedroom: {
    rect: [-1, 4, 1, 6],
    door: [0.0, 1], hall: [0.0, 0], inside: [0.0, 1.7],
    slots: [[0.2, 3.6], [1.9, 4.8], [0.3, 5.1], [3.4, 4.8], [0.3, 2.2]],
    player: [1.15, 4.0],
    label: [1.5, 0.55, 5.6],
  },
  kids: {
    rect: [4, 9, 1, 6],
    door: [5.0, 1], hall: [5.0, 0], inside: [5.0, 1.7],
    slots: [[6.3, 3.6], [5.0, 4.3], [7.6, 4.4], [6.3, 5.1], [5.2, 2.6]],
    player: [7.0, 2.4],
    label: [6.5, 0.55, 5.6],
  },
  garden: {
    rect: [9, 15, -7, 6],
    door: [9, 0], hall: [8.3, 0], inside: [9.8, 0],
    slots: [[11.2, 1.4], [12.7, 0.4], [11.0, -1.2], [12.6, 2.6], [13.0, -1.6]],
    player: [10.6, 3.2],
    label: [12, 1.1, -6.5],
  },
};

/**
 * Ambient "jobs" per room: [x, z, lookX, lookZ]. A robot pottering in its room walks
 * to a point (in front of a prop), faces the look target and works there for a bit.
 */
export const WORK_POINTS = {
  kitchen: [[-4.3, -5.55, -4.3, -6.5], [-2.2, -5.55, -2.2, -6.5], [-0.35, -5.45, -0.35, -6.45], [-1.05, -3.9, -2.4, -3.9]],
  living: [[5.5, -5.2, 5.5, -6.3], [7.5, -4.4, 8.6, -4.4], [4.15, -4.6, 5.5, -4.6], [2.5, -5.3, 2.1, -6.45]],
  garage: [[-11.8, -1.75, -11.8, -3.0], [-12.45, -0.9, -13.5, -0.9], [-10.1, -5.85, -10.1, -6.7], [-10.25, -4.3, -11.8, -4.3]],
  utility: [[-8.45, -5.3, -8.45, -6.5], [-7.5, -5.3, -7.55, -6.5], [-6.3, -4.35, -6.1, -5.4]],
  hallway: [[7.9, 0.05, 8.45, -0.62], [7.2, 0.0, 7.2, 0.78], [-3.0, 0.1, -3.0, -0.66], [-7.9, 0.0, -8.5, 0.62]],
  security: [[-7.6, 2.45, -7.65, 1.5], [-7.6, 5.3, -8.45, 5.3], [-6.5, 2.5, -6.9, 1.6]],
  office: [[-3.3, 2.55, -3.3, 1.6], [-3.75, 3.9, -4.6, 3.9], [-2.1, 3.4, -1.3, 3.4]],
  bedroom: [[1.0, 2.7, 2.5, 2.7], [0.1, 1.95, -0.7, 1.95], [2.5, 4.35, 2.5, 3.5]],
  kids: [[5.3, 4.55, 4.8, 5.3], [7.0, 2.4, 8.25, 2.2], [4.7, 2.45, 4.65, 1.45], [6.9, 4.85, 7.4, 5.45]],
  garden: [[13.3, -5.5, 14.3, -5.5], [12.65, -2.9, 13.9, -2.9], [10.2, 3.8, 9.4, 3.8], [13.3, 3.9, 14.1, 4.9]],
};

/** Centre of the kitchen meeting table (robots gather here at the start of a day). */
export const TABLE_CENTER = [-2.4, -3.9];

export const ROOM_IDS = Object.keys(ROOMS_LAYOUT);

/** Charging dock in the kitchen's back-right corner. One pad per robot (CAST order). */
export const DOCK_PADS = [
  [1.0, -6.3], [0.3, -5.5], [1.0, -4.7], [0.3, -3.9], [1.0, -3.1], // zig-zag so big robots fit
];
export const DOCK_ROOM = 'kitchen';

/** Whole diorama extents incl. the garden and a sliver of the neighbour's plot. */
export const BOUNDS = { x0: -14.4, x1: 17.2, z0: -7.4, z1: 6.4, y0: -0.6, y1: 2.4 };

// ---------------------------------------------------------------------------
// Walls. Each line is split around any doorway that sits on it.
// h: back walls tall (read as a backdrop), interior half height, front walls low
// so nothing blocks the view (dollhouse cut-away).
const BACK = 1.25;
const MID = 0.62;
const FRONT = 0.34;
const T = 0.16; // wall thickness

const WALL_LINES = [
  // along x (fixed z)
  { axis: 'x', at: -7, from: -14, to: 9, h: BACK },
  { axis: 'x', at: -1, from: -9, to: 9, h: MID },
  { axis: 'x', at: 1, from: -9, to: 9, h: MID },
  { axis: 'x', at: 1, from: -14, to: -9, h: FRONT, gaps: [[-11.5, 3.0]] }, // garage roller door
  { axis: 'x', at: 6, from: -9, to: 9, h: FRONT },
  // along z (fixed x)
  { axis: 'z', at: -14, from: -7, to: 1, h: BACK },
  { axis: 'z', at: -9, from: -7, to: 6, h: MID },
  { axis: 'z', at: -5.5, from: -7, to: -1, h: MID },
  { axis: 'z', at: 1.5, from: -7, to: -1, h: MID },
  { axis: 'z', at: -5, from: 1, to: 6, h: MID },
  { axis: 'z', at: -1, from: 1, to: 6, h: MID },
  { axis: 'z', at: 4, from: 1, to: 6, h: MID },
  { axis: 'z', at: 9, from: -7, to: 6, h: FRONT },
];

const DOOR_W = 1.25;

/** [{ x, z, len, rotY, h, t }] box segments (centre + length along its axis). */
export function buildWallSegments() {
  const doors = Object.values(ROOMS_LAYOUT).map((r) => r.door);
  const out = [];
  for (const line of WALL_LINES) {
    const gaps = [...(line.gaps ?? [])];
    for (const [dx, dz] of doors) {
      const onLine = line.axis === 'x' ? Math.abs(dz - line.at) < 1e-6 && dx > line.from && dx < line.to
        : Math.abs(dx - line.at) < 1e-6 && dz > line.from && dz < line.to;
      if (onLine) gaps.push([line.axis === 'x' ? dx : dz, DOOR_W]);
    }
    gaps.sort((a, b) => a[0] - b[0]);
    let cursor = line.from;
    const pieces = [];
    for (const [c, w] of gaps) {
      if (c - w / 2 > cursor) pieces.push([cursor, c - w / 2]);
      cursor = Math.max(cursor, c + w / 2);
    }
    if (cursor < line.to) pieces.push([cursor, line.to]);
    for (const [a, b] of pieces) {
      const mid = (a + b) / 2;
      const len = b - a + T; // overlap the corners
      out.push(line.axis === 'x'
        ? { x: mid, z: line.at, len, rotY: 0, h: line.h, t: T }
        : { x: line.at, z: mid, len, rotY: Math.PI / 2, h: line.h, t: T });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Helpers

export const roomCenter = (id) => {
  const [x0, x1, z0, z1] = ROOMS_LAYOUT[id].rect;
  return [(x0 + x1) / 2, (z0 + z1) / 2];
};

export const roomSize = (id) => {
  const [x0, x1, z0, z1] = ROOMS_LAYOUT[id].rect;
  return [x1 - x0, z1 - z0];
};

export function roomAt(x, z) {
  // hallway first (its rect touches its neighbours' walls)
  for (const id of ['hallway', ...ROOM_IDS.filter((r) => r !== 'hallway')]) {
    const [x0, x1, z0, z1] = ROOMS_LAYOUT[id].rect;
    if (x >= x0 && x <= x1 && z >= z0 && z <= z1) return id;
  }
  return null;
}

/** Robot standing spot: slot i of room (wraps with a small offset if > 5 share a room). */
export function robotSlot(roomId, i) {
  const slots = (ROOMS_LAYOUT[roomId] ?? ROOMS_LAYOUT.kitchen).slots;
  const [x, z] = slots[i % slots.length];
  const ring = Math.floor(i / slots.length);
  return [x + ring * 0.7, z + ring * 0.5];
}

/**
 * Waypoints (world [x, z]) from a position in `fromRoom` to `target` in `toRoom`,
 * routed through doorways and along the hallway spine.
 */
export function planPath(from, fromRoom, toRoom, target) {
  const pts = [];
  if (fromRoom === toRoom) return [target];
  const A = ROOMS_LAYOUT[fromRoom];
  const B = ROOMS_LAYOUT[toRoom];
  if (!A || !B) return [target];
  if (fromRoom !== 'hallway') pts.push(A.inside, A.door, A.hall);
  else pts.push([from[0], 0]);
  if (toRoom !== 'hallway') pts.push(B.hall, B.door, B.inside);
  pts.push(target);
  // drop consecutive duplicates
  return pts.filter((p, i) => i === 0 || p[0] !== pts[i - 1][0] || p[1] !== pts[i - 1][1]);
}

/** Camera: fixed isometric-style angles (radians). */
export const CAMERA = {
  azimuth: (24 * Math.PI) / 180, // rotation around y, from +z toward +x
  portraitAzimuth: (80 * Math.PI) / 180, // used when the viewport is taller than wide
  elevation: (44 * Math.PI) / 180,
  distance: 60,
};

/** Robots face the camera when standing still. */
export const FACE_CAMERA_Y = CAMERA.azimuth;
