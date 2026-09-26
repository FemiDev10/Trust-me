// A flat ink-and-vinyl head for each robot: distinct silhouettes readable at 32px.
// Used in the HUD (cheap, no WebGL) and as the fallback when RobotPortrait is absent.
import { castById } from '../../engine/index.js';

const INK = '#031012';

function Eyes({ cx = 32, cy = 36, gap = 9, r = 6.2, off, screen }) {
  if (off) {
    return (
      <g stroke={screen ? '#3a5a5a' : INK} strokeWidth="3" strokeLinecap="round">
        <path d={`M${cx - gap - 4} ${cy}h8M${cx + gap - 4} ${cy}h8`} />
      </g>
    );
  }
  const fill = screen ? '#3ee6e0' : '#fff';
  return (
    <g>
      {[-gap, gap].map((dx) => (
        <g key={dx}>
          <ellipse cx={cx + dx} cy={cy} rx={r} ry={r * 1.12} fill={fill} stroke={screen ? 'none' : INK} strokeWidth="2.6" />
          {!screen && <circle cx={cx + dx + 1.2} cy={cy + 1} r={r * 0.42} fill={INK} />}
        </g>
      ))}
    </g>
  );
}

const HEADS = {
  BOLT: (c, off) => (
    <>
      <path d="M33 4l-6 9h5l-3 7 8-10h-5l3-6z" fill={off ? '#667' : c} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <rect x="11" y="19" width="42" height="36" rx="9" fill={c} stroke={INK} strokeWidth="3" />
      <rect x="11" y="45" width="42" height="4" fill={INK} opacity="0.18" />
      <Eyes cy={34} off={off} />
    </>
  ),
  MOCHI: (c, off) => (
    <>
      <path d="M28 14c2-4 6-4 8 0" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="32" cy="36" rx="23" ry="19" fill={c} stroke={INK} strokeWidth="3" />
      <ellipse cx="18" cy="42" rx="3.5" ry="2" fill="#fff" opacity="0.45" />
      <ellipse cx="46" cy="42" rx="3.5" ry="2" fill="#fff" opacity="0.45" />
      <Eyes cy={35} gap={8.5} r={5.6} off={off} />
    </>
  ),
  ZIGGY: (c, off) => (
    <>
      <rect x="17" y="10" width="30" height="48" rx="15" fill={c} stroke={INK} strokeWidth="3" />
      <path d="M12 30V24l5-5 5 4 5-5 5 4 5-4 5 5 5-4 5 5v6" fill="none" stroke={INK} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      <rect x="8" y="27" width="9" height="14" rx="4" fill={INK} />
      <rect x="47" y="27" width="9" height="14" rx="4" fill={INK} />
      <Eyes cy={33} gap={7} r={5} off={off} />
    </>
  ),
  PIP: (c, off) => (
    <>
      <path d="M24 13l-5-7M40 13l5-7" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
      <rect x="8" y="12" width="48" height="40" rx="11" fill={c} stroke={INK} strokeWidth="3" />
      <rect x="15" y="19" width="34" height="26" rx="6" fill="#0a1d22" stroke={INK} strokeWidth="2" />
      <Eyes cy={31} gap={8} r={4.6} off={off} screen />
      {!off && <path d="M27 39q5 3 10 0" fill="none" stroke="#3ee6e0" strokeWidth="2.2" strokeLinecap="round" />}
      <rect x="22" y="52" width="6" height="7" rx="2" fill={INK} />
      <rect x="36" y="52" width="6" height="7" rx="2" fill={INK} />
    </>
  ),
  JUNO: (c, off) => (
    <>
      <ellipse cx="32" cy="9" rx="14" ry="4" fill="none" stroke={off ? '#667' : c} strokeWidth="3.2" />
      <ellipse cx="32" cy="9" rx="14" ry="4" fill="none" stroke={INK} strokeWidth="1" opacity="0.6" />
      <path d="M9 52V38a23 23 0 0 1 46 0v14z" fill={c} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <rect x="9" y="47" width="46" height="5" fill={INK} opacity="0.2" />
      <Eyes cy={37} off={off} />
    </>
  ),
};

export default function RobotBadge({ id, size = 40, off = false, className, style }) {
  const cast = castById(id);
  const colour = off ? '#51625f' : cast?.hex ?? '#888';
  const head = HEADS[id] ?? HEADS.BOLT;
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} style={style} aria-label={cast?.name ?? id} role="img">
      {head(colour, off)}
    </svg>
  );
}
