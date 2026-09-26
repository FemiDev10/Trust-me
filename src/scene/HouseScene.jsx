import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { Rooms } from './house/Rooms.jsx';
import { Walls, Plinth } from './house/Walls.jsx';
import { Props } from './house/Props.jsx';
import { Lighting, MOOD_BG } from './house/Lighting.jsx';
import { Robots } from './house/Robots.jsx';
import { PlayerMarker } from './house/PlayerMarker.jsx';
import { CameraRig } from './house/CameraRig.jsx';
import { LabelLayer, LabelProjector, roomLabelAnchors } from './house/Labels.jsx';
import './house/house.css';

/**
 * The interactive 3D house diorama. Fills its parent (absolute, inset 0).
 *
 * @param {object}   props
 * @param {Array}    props.robots        getRobots(state): [{ id, status, roomId|room, ... }]
 * @param {string?}  props.playerRoom    room id where the human stands (YOU marker)
 * @param {string[]} props.activeRoomIds rooms clickable right now (cyan outline + hover glow)
 * @param {Function} props.onRoomClick   (roomId) => void, only fired for active rooms
 * @param {string?}  props.focusRobotId  gentle camera nudge + selection ring
 * @param {object}   props.robotLook     { [id]: { pose?, expression?, reveal?, dimmed? } } overrides
 * @param {'day'|'night'|'alarm'|'takeover'} props.mood lighting preset
 * Optional extras:
 * @param {Function} props.onRobotClick  (robotId) => void
 * @param {object}   props.insets        { top, right, bottom, left } px reserved by HUD; the house fits the rest
 * @param {boolean}  props.gatherAtTable all active robots stand at the kitchen table (pass phase === 'task');
 *                                       when it flips to false they visibly walk out to their rooms
 * @param {boolean}  props.introWalk     (default true) on mount, assigned robots start at the table and walk out
 */
export default function HouseScene({
  robots = [],
  playerRoom = null,
  activeRoomIds = [],
  onRoomClick,
  focusRobotId = null,
  robotLook,
  mood = 'night',
  onRobotClick,
  insets,
  gatherAtTable = false,
  introWalk = true,
  className,
  style,
}) {
  const [hovered, setHovered] = useState(null);
  const positions = useRef({});
  const center = useMemo(() => [0.5, 0, -0.5], []);
  const moodKey = MOOD_BG[mood] ? mood : 'night';
  const activeSet = useMemo(() => new Set(activeRoomIds ?? []), [activeRoomIds]);
  const anchors = useRef(null);
  if (!anchors.current) anchors.current = { ...roomLabelAnchors(), you: null };
  const labelEls = useRef({});

  return (
    <div className={`hs-root hs-mood-${moodKey}${className ? ` ${className}` : ''}`} style={style}>
      <Canvas
        shadows="percentage"
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onCreated={(state) => {
          const { gl, scene } = state;
          if (import.meta.env.DEV) window.__houseScene = state; // perf debugging only
          gl.toneMapping = THREE.AgXToneMapping;
          gl.toneMappingExposure = 1.15;
          scene.background = new THREE.Color(MOOD_BG[moodKey]);
        }}
        onPointerMissed={() => setHovered(null)}
      >
        <CameraRig focusRobotId={focusRobotId} playerRoom={playerRoom} positions={positions} insets={insets} />
        <Lighting mood={moodKey} center={center} />
        <Plinth />
        <Rooms
          activeSet={activeSet}
          hovered={hovered}
          setHovered={setHovered}
          onRoomClick={onRoomClick}
        />
        <Walls />
        <Props />
        <PlayerMarker playerRoom={playerRoom} anchors={anchors} />
        <Robots
          robots={robots}
          robotLook={robotLook}
          focusRobotId={focusRobotId}
          playerRoom={playerRoom}
          positions={positions}
          anchors={anchors}
          onRobotClick={onRobotClick}
          gatherAtTable={gatherAtTable}
          introWalk={introWalk}
        />
        <LabelProjector anchors={anchors} els={labelEls} />
      </Canvas>
      <div className="hs-vignette" />
      <LabelLayer
        els={labelEls}
        activeSet={activeSet}
        hovered={hovered}
        setHovered={setHovered}
        playerRoom={playerRoom}
        onRoomClick={onRoomClick}
        robots={robots}
        focusRobotId={focusRobotId}
      />
    </div>
  );
}
