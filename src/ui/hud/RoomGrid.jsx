// Stylised 2D diorama used when src/scene/HouseScene.jsx is absent or fails.
// Same props as HouseScene so the game is fully playable either way.
import { motion, LayoutGroup } from 'framer-motion';
import { ROOMS } from '../../engine/index.js';
import RobotBadge from './RobotBadge.jsx';
import Icon from './icons.jsx';

const AREA = {
  bedroom: 'bed', kids: 'kids', office: 'off', security: 'sec',
  living: 'liv', hallway: 'hall', kitchen: 'kit',
  garage: 'gar', utility: 'util', garden: 'gdn',
};
const ROLE_ICON = { meeting: 'alarm', camera: 'camera', keys: 'keys', question: 'question', test: 'test' };

export default function RoomGrid({ robots = [], playerRoom = null, activeRoomIds = [], onRoomClick, focusRobotId = null, mood = 'day' }) {
  return (
    <div className={`roomgrid roomgrid--${mood}`}>
      <LayoutGroup id="roomgrid">
        <div className="roomgrid__plan">
          {ROOMS.map((room, idx) => {
            const active = activeRoomIds.includes(room.id);
            const here = robots.filter((r) => (r.room ?? r.roomId) === room.id && r.status !== 'unplugged');
            const isPlayer = playerRoom === room.id;
            return (
              <motion.button
                key={room.id}
                type="button"
                className={`room room--${room.role} room--at-${room.id} ${active ? 'is-active' : ''} ${isPlayer ? 'is-player' : ''}`}
                style={{ gridArea: AREA[room.id] }}
                onClick={() => active && onRoomClick?.(room.id)}
                aria-disabled={!active || undefined}
                aria-label={`${room.name}${here.length ? `: ${here.map((r) => r.name).join(', ')}` : ''}${isPlayer ? ' (you are here)' : ''}`}
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 24, delay: idx * 0.03 }}
                whileHover={active ? { y: -5, scale: 1.02 } : undefined}
                whileTap={active ? { scale: 0.97 } : undefined}
              >
                <span className="room__floor" />
                <span className="room__name">
                  {ROLE_ICON[room.role] && <Icon name={ROLE_ICON[room.role]} size={14} />}
                  {room.name}
                </span>
                {isPlayer && (
                  <motion.span layoutId="player-marker" className="room__you" transition={{ type: 'spring', stiffness: 300, damping: 24 }}>
                    <Icon name="pin" size={14} /> You are here
                  </motion.span>
                )}
                <span className="room__bots">
                  {here.map((r) => (
                    <motion.span
                      key={r.id}
                      layoutId={`gridbot-${r.id}`}
                      className={`room__bot ${focusRobotId === r.id ? 'is-focus' : ''} ${r.status === 'sittingOut' ? 'is-out' : ''}`}
                      transition={{ type: 'spring', stiffness: 170, damping: 20 }}
                      style={{ '--rc': r.hex }}
                    >
                      <RobotBadge id={r.id} size={34} />
                    </motion.span>
                  ))}
                </span>
              </motion.button>
            );
          })}
        </div>
      </LayoutGroup>
    </div>
  );
}
