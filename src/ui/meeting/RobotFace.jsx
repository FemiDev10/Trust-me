// 2D vector robot head: the fallback for RobotPortrait and the small avatar used in
// bubbles, poll cards and timelines (keeps WebGL contexts for the big portraits only).
import { castById } from '../../engine/index.js';

const INK = '#031012';
const RED = '#ff3b3b';

function Head({ id, hex, reveal }) {
  const seam = reveal ? RED : 'rgba(255,255,255,0.55)';
  switch (id) {
    case 'BOLT':
      return (
        <g>
          <line x1="50" y1="22" x2="50" y2="10" stroke={INK} strokeWidth="3" />
          <polygon points="46,2 56,2 50,9 57,9 44,20 48,11 42,11" fill={hex} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
          <rect x="14" y="22" width="72" height="62" rx="12" fill={hex} stroke={INK} strokeWidth="3.5" />
          <line x1="22" y1="76" x2="78" y2="76" stroke={seam} strokeWidth="2" strokeLinecap="round" />
        </g>
      );
    case 'MOCHI':
      return (
        <g>
          <ellipse cx="50" cy="56" rx="40" ry="34" fill={hex} stroke={INK} strokeWidth="3.5" />
          <ellipse cx="34" cy="34" rx="10" ry="5" fill="rgba(255,255,255,0.45)" transform="rotate(-24 34 34)" />
          <path d="M20 74 Q50 86 80 74" fill="none" stroke={seam} strokeWidth="2" strokeLinecap="round" />
        </g>
      );
    case 'ZIGGY':
      return (
        <g>
          <rect x="24" y="12" width="52" height="80" rx="26" fill={hex} stroke={INK} strokeWidth="3.5" />
          <path d="M18 50 Q18 8 50 8 Q82 8 82 50" fill="none" stroke={INK} strokeWidth="4" />
          <path d="M22 26 l4 -4 l4 4 l4 -4" fill="none" stroke={seam} strokeWidth="2" />
          <rect x="12" y="42" width="14" height="22" rx="6" fill={hex} stroke={INK} strokeWidth="3" />
          <rect x="74" y="42" width="14" height="22" rx="6" fill={hex} stroke={INK} strokeWidth="3" />
          <line x1="36" y1="84" x2="64" y2="84" stroke={seam} strokeWidth="2" strokeLinecap="round" />
        </g>
      );
    case 'PIP':
      return (
        <g>
          <line x1="40" y1="20" x2="32" y2="8" stroke={INK} strokeWidth="3" />
          <line x1="60" y1="20" x2="68" y2="8" stroke={INK} strokeWidth="3" />
          <rect x="10" y="20" width="80" height="64" rx="16" fill={hex} stroke={INK} strokeWidth="3.5" />
          <rect x="20" y="29" width="60" height="46" rx="10" fill="#0a1a26" stroke={INK} strokeWidth="2.5" />
          <line x1="24" y1="80" x2="76" y2="80" stroke={seam} strokeWidth="2" strokeLinecap="round" />
        </g>
      );
    case 'JUNO':
    default:
      return (
        <g>
          <ellipse className="rf-halo" cx="50" cy="10" rx="24" ry="5" fill="none" stroke={reveal ? RED : '#e9dcff'} strokeWidth="3" />
          <path d="M14 84 L14 54 A36 36 0 0 1 86 54 L86 84 Q86 88 82 88 L18 88 Q14 88 14 84 Z" fill={hex} stroke={INK} strokeWidth="3.5" />
          <path d="M20 58 Q50 46 80 58" fill="none" stroke={seam} strokeWidth="2" />
        </g>
      );
  }
}

function Eyes({ id, expression, pose, reveal }) {
  const screen = id === 'PIP';
  const y = id === 'ZIGGY' ? 46 : id === 'MOCHI' ? 54 : id === 'JUNO' ? 66 : 50;
  const dx = id === 'ZIGGY' ? 11 : 15;
  const off = pose === 'off' || expression === 'sleepy';
  const eyeFill = reveal ? RED : screen ? '#3ee6e0' : '#fff';
  const brow = { worried: [5, 0], angry: [-6, 0], smug: [1, 0] }[expression];

  return (
    <g className={reveal ? 'rf-glitch' : undefined}>
      {[-1, 1].map((side) => {
        const cx = 50 + side * dx;
        if (off) return <line key={side} x1={cx - 7} y1={y + 2} x2={cx + 7} y2={y + 2} stroke={screen ? '#3ee6e0' : INK} strokeWidth="3.5" strokeLinecap="round" />;
        return (
          <g key={side}>
            <ellipse cx={cx} cy={y} rx={screen ? 7 : 10} ry={screen ? 9 : 11} fill={eyeFill} stroke={screen ? 'none' : INK} strokeWidth="3" />
            {!screen && !reveal && <circle cx={cx + (expression === 'smug' ? 2 : 0)} cy={y + (expression === 'worried' ? -1 : 1)} r="4.2" fill={INK} />}
            {expression === 'smug' && <rect x={cx - 11} y={y - 12} width="22" height="10" fill={screen ? '#0a1a26' : 'currentColor'} className="rf-lid" />}
            {expression === 'happy' && !screen && <path d={`M${cx - 10} ${y + 7} Q${cx} ${y + 1} ${cx + 10} ${y + 7}`} fill="currentColor" className="rf-lid" />}
            {brow && (() => {
              const y0 = y - 17;
              const inner = y0 - brow[0];
              const outer = y0 + brow[0] * 0.3;
              const [ly, ry] = side < 0 ? [outer, inner] : [inner, outer];
              return <line x1={cx - 9} y1={ly} x2={cx + 9} y2={ry} stroke={screen ? '#3ee6e0' : INK} strokeWidth="3.5" strokeLinecap="round" />;
            })()}
          </g>
        );
      })}
      {pose === 'talk' && (
        <ellipse className="rf-mouth" cx="50" cy={y + 18} rx="6" ry="4" fill={screen ? '#3ee6e0' : INK} />
      )}
      {pose === 'celebrate' && <path d={`M40 ${y + 14} Q50 ${y + 24} 60 ${y + 14}`} fill="none" stroke={screen ? '#3ee6e0' : INK} strokeWidth="3.5" strokeLinecap="round" />}
      {pose === 'sad' && <path d={`M42 ${y + 22} Q50 ${y + 15} 58 ${y + 22}`} fill="none" stroke={screen ? '#3ee6e0' : INK} strokeWidth="3" strokeLinecap="round" />}
    </g>
  );
}

export default function RobotFace({ id, pose = 'idle', expression = 'neutral', reveal = false, size = 64, className = '' }) {
  const c = castById(id);
  const hex = c?.hex ?? '#888';
  const off = pose === 'off';
  return (
    <svg
      className={`rf ${off ? 'rf--off' : ''} ${reveal ? 'rf--reveal' : ''} ${className}`}
      viewBox="0 0 100 100" width={size} height={size} style={{ color: hex }} aria-label={c?.name ?? id} role="img"
    >
      <Head id={id} hex={hex} reveal={reveal} />
      <Eyes id={id} expression={expression} pose={pose} reveal={reveal} />
    </svg>
  );
}
