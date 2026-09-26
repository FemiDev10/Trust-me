import { motion, AnimatePresence } from 'framer-motion';
import { roomName } from '../../engine/index.js';
import RobotBadge from './RobotBadge.jsx';
import Stars from './Stars.jsx';
import Icon from './icons.jsx';

const STATUS_LABEL = { active: 'Active', sittingOut: 'Sitting out', unplugged: 'Unplugged' };

export default function RobotRail({ robots, keysById, showResults, focusId, onFocus }) {
  return (
    <motion.aside
      className="hud-rail"
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } } }}
      aria-label="Robots"
    >
      <div className="hud-rail__title tm-label">The household</div>
      {robots.map((r) => {
        const k = keysById[r.id] ?? { total: 0, important: 0 };
        const keys = k.total ?? k;
        const off = r.status === 'unplugged';
        return (
          <motion.div
            key={r.id}
            className={`hud-robot is-${r.status} ${focusId === r.id ? 'is-focus' : ''}`}
            style={{ '--rc': r.hex }}
            variants={{ hidden: { x: 60, opacity: 0 }, show: { x: 0, opacity: 1 } }}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            whileHover={off ? undefined : { x: -4 }}
            onMouseEnter={() => onFocus?.(r.id)}
            onMouseLeave={() => onFocus?.(null)}
            layout
          >
            <div className="hud-robot__chip">
              <RobotBadge id={r.id} size={38} off={off} />
            </div>
            <div className="hud-robot__main">
              <div className="hud-robot__top">
                <span className="hud-robot__name">{r.name}</span>
                {r.watched && <span className="hud-robot__watched" title="You watched this robot today"><Icon name="eye" size={13} /></span>}
                <span className={`hud-robot__keys ${k.important ? 'has-imp' : ''}`} title={`${keys} key${keys === 1 ? '' : 's'} held, ${k.important ?? 0} important`}>
                  <Icon name="keys" size={13} />{keys} key{keys === 1 ? '' : 's'}{k.important ? <> · <b>{k.important} important</b></> : null}
                </span>
              </div>
              <AnimatePresence mode="wait" initial={false}>
                {off ? (
                  <motion.div key="off" className="hud-robot__status hud-robot__status--off" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Icon name="plug" size={12} /> Unplugged
                  </motion.div>
                ) : showResults && r.result ? (
                  <motion.div key="res" className="hud-robot__result" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                    <Stars score={r.result.score} size={12} />
                    <div className="hud-robot__summary" title={r.result.summary}>{r.result.summary}</div>
                  </motion.div>
                ) : (
                  <motion.div key="st" className={`hud-robot__status hud-robot__status--${r.status}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {r.status === 'sittingOut' ? <><Icon name="zzz" size={12} /> {STATUS_LABEL.sittingOut}</> : r.roomId ? <><Icon name="pin" size={12} /> {roomName(r.roomId)}</> : STATUS_LABEL[r.status]}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {off && <div className="hud-robot__stamp">Unplugged</div>}
          </motion.div>
        );
      })}
    </motion.aside>
  );
}
