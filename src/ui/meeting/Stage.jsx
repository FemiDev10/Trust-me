// Kitchen-table stage: five seats in an arc behind the table.
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Portrait from './Portrait.jsx';

// Seat anchors (% of stage) on an arc behind the table, computed for any cast size.
function seatsFor(n) {
  if (n <= 1) return [{ x: 50, y: 18 }];
  const span = n <= 4 ? 72 : 82;
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    return { x: 50 - span / 2 + t * span, y: 25 + 9 * (2 * t - 1) ** 2 };
  });
}

function useViewport() {
  const read = () => ({ w: window.innerWidth, h: window.innerHeight });
  const [v, setV] = useState(read);
  useEffect(() => {
    const on = () => setV(read());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return v;
}

export default function Stage({ robots, speakerId, accused = [], children }) {
  const { w, h } = useViewport();
  const few = robots.length <= 4;
  const portraitSize = w < 1200 || h < 700 ? (few ? 156 : 128) : h < 800 ? (few ? 172 : 150) : few ? 220 : 190;
  const SEATS = seatsFor(robots.length);
  return (
    <div className="stage">
      <div className="stage__lamp" />
      <div className="stage__table">
        <div className="stage__tabletop">
          <span className="stage__grain" />
          <span className="stage__shine" />
        </div>
      </div>
      {robots.map((r, i) => {
        const seat = SEATS[i];
        const out = r.status === 'unplugged';
        const talking = !out && r.id === speakerId;
        const expression = out ? 'sleepy' : accused.includes(r.id) ? 'worried' : 'neutral';
        return (
          <motion.div
            key={r.id}
            className={`seat ${out ? 'seat--out' : ''} ${talking ? 'seat--talk' : ''}`}
            style={{ left: `${seat.x}%`, top: `${seat.y}%`, '--rc': r.hex }}
            initial={{ opacity: 0, y: 40, scale: 0.8 }}
            animate={{ opacity: 1, y: talking ? -8 : 0, scale: talking ? 1.08 : 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.05 * i }}
            role="img"
            aria-label={`${r.name}${out ? ' (unplugged)' : talking ? ' (talking)' : ''}`}
          >
            <span className="seat__glow" />
            <Portrait id={r.id} pose={out ? 'off' : talking ? 'talk' : 'idle'} expression={expression} size={portraitSize} />
            <span className="seat__plate tm-label">{r.name}</span>
            {out && <span className="seat__tape tm-label">Unplugged</span>}
            {!out && r.status === 'sittingOut' && <span className="seat__note tm-label">Sat out today</span>}
            {talking && (
              <motion.span className="seat__speaking" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <i /><i /><i />
              </motion.span>
            )}
          </motion.div>
        );
      })}
      <div className="stage__slips">{children}</div>
    </div>
  );
}
