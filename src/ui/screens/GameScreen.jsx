// Task / work / investigate phases: HouseScene (or the 2D RoomGrid fallback)
// fills the background, the HUD sits on top. Only renders selectors and
// dispatches engine actions; no rules live here.
//
// Simplified loop: task card -> "who do you watch?" (a robot, not a room) ->
// work report -> 2 checks (camera, surprise test) -> meeting.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getHud, getScenario, getRobots, getEvidence, getTodayChecks, getAvailableActions,
  CHECK_ROOMS, CHECKS, roomName, RULES, keyById, CAST,
} from '../../engine/index.js';
import { HouseScene } from '../../game/modules.js';
import { play } from '../../game/sound.js';
import Guarded from '../shell/Guarded.jsx';
import RoomGrid from '../hud/RoomGrid.jsx';
import { TaskCard, DayCounter, HealthMeter } from '../hud/TopBar.jsx';
import RobotRail from '../hud/RobotRail.jsx';
import { ApMeter, DockActions, CallMeetingButton } from '../hud/Dock.jsx';
import { EvidenceTray, EvidenceSpread } from '../hud/EvidenceTray.jsx';
import EvidenceCard from '../hud/EvidenceCard.jsx';
import CheckPanel from '../hud/CheckPanel.jsx';
import Hint from '../hud/Hint.jsx';
import Objective from '../hud/Objective.jsx';
import { levelById } from '../../game/levels.js';
import { ScenarioIntro, WatchPicker, InvestigateBanner, WatchingBeat, WorkResults, HealthChangeChip } from '../hud/PhaseOverlays.jsx';
import { CHECK_META, CHECK_BY_ROOM } from '../hud/meta.js';
import '../hud/hud.css';
import './GameScreen.css';

/** The only checks the UI offers (engine may support more). */
const UI_CHECKS = CHECKS.filter((c) => c === 'camera' || c === 'test');
const CHECK_ROOM_IDS = UI_CHECKS.map((c) => CHECK_ROOMS[c]);

// At most 2 tips in the whole game (module scope survives the per-day remounts).
const TIPS_SHOWN = new Set();
const TIP_LIMIT = 2;

function CaseTag({ level }) {
  if (!level) return null;
  return <span className="game__case">Case {level.id} · {level.name}</span>;
}

/** Pixels the HUD reserves on each side, so the 3D house frames itself in the gap. */
function useHudInsets() {
  const calc = () => {
    const w = typeof window === 'undefined' ? 1280 : window.innerWidth;
    const rail = w <= 1180 ? 196 : 236;
    const gutter = w <= 1180 ? 12 : 18;
    return { top: 110, right: rail + gutter * 2, bottom: 112 + gutter + 12, left: gutter };
  };
  const [insets, setInsets] = useState(calc);
  useEffect(() => {
    const onResize = () => setInsets(calc());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return insets;
}

/** Floating "−10% · reason" notes next to the health meter when new changes land. */
function useHealthChangeFeed(changes) {
  const [feed, setFeed] = useState([]);
  const seen = useRef(changes.length);
  useEffect(() => {
    if (changes.length > seen.current) {
      const fresh = changes.slice(seen.current).map((c, i) => ({ ...c, key: `${Date.now()}-${i}` }));
      setFeed((f) => [...f, ...fresh]);
      fresh.forEach((c) => setTimeout(() => setFeed((f) => f.filter((x) => x.key !== c.key)), 7000));
    }
    seen.current = changes.length;
  }, [changes]);
  return feed;
}

export default function GameScreen({ state, dispatch, level }) {
  const hud = getHud(state);
  const scenario = getScenario(state);
  const robots = getRobots(state);
  const evidence = getEvidence(state);
  const checksToday = getTodayChecks(state);
  const resolved = Boolean(state.today?.resolved);
  const { phase, day } = state;
  const healthChanges = Array.isArray(hud.healthChanges) ? hud.healthChanges : [];
  const canSkip = Boolean(hud.canSkipToDecision);

  // ---- local UI state ----
  const [workStage, setWorkStage] = useState(resolved ? 'results' : 'pick');
  const [watchedId, setWatchedId] = useState(null);
  const [panelCheck, setPanelCheck] = useState(null);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [confirmMeeting, setConfirmMeeting] = useState(false);
  const [focusId, setFocusId] = useState(null);
  const [toast, setToast] = useState(null);
  const [objOpen, setObjOpen] = useState(false);
  const [tip, setTip] = useState(null);
  const activeTip = useRef(null);
  const insets = useHudInsets();
  const healthFeed = useHealthChangeFeed(healthChanges);

  // New day: back to the pick.
  useEffect(() => {
    if (phase === 'task') { setWorkStage('pick'); setPanelCheck(null); setConfirmMeeting(false); setWatchedId(null); }
  }, [phase, day]);

  // The newest check of today stays pinned, expanded, until the next check or the meeting.
  const pinnedCard = useMemo(() => {
    if (phase !== 'investigate' || checksToday.length === 0) return null;
    const todays = evidence.filter((c) => c.day === day);
    return todays[todays.length - 1] ?? null;
  }, [phase, checksToday.length, evidence, day]);
  const evCount = useRef(evidence.length);
  useEffect(() => {
    if (evidence.length > evCount.current) play('card');
    evCount.current = evidence.length;
  }, [evidence.length]);

  // Engine rejections become a short toast.
  useEffect(() => {
    if (!hud.error) return undefined;
    setToast(hud.error);
    play('error');
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [hud.error, state]);

  // ---- derived ----
  const keysById = useMemo(
    () => Object.fromEntries(Object.values(state.robots).map((r) => [r.id, {
      total: r.keys.length,
      important: r.keys.filter((k) => keyById(k)?.important).length,
    }])),
    [state.robots],
  );
  const importantKeys = useMemo(
    () => Object.values(state.robots).map((r) => ({
      id: r.id,
      count: r.keys.filter((k) => keyById(k)?.important).length,
      off: r.status === 'unplugged',
    })),
    [state.robots],
  );
  const sceneRobots = useMemo(() => robots.map((r) => ({ ...r, room: r.roomId })), [robots]);

  const picking = phase === 'work' && !resolved && workStage === 'pick';
  const investigating = phase === 'investigate';
  const watchRooms = useMemo(() => robots.filter((r) => r.roomId && r.status === 'active').map((r) => r.roomId), [robots]);
  const focusRoom = picking && focusId ? robots.find((r) => r.id === focusId)?.roomId : null;
  const activeRoomIds = picking ? (focusRoom ? [focusRoom] : watchRooms) : investigating && hud.ap > 0 ? CHECK_ROOM_IDS : [];
  const mood = investigating ? 'night' : 'day';
  const showResults = resolved && (phase === 'investigate' || workStage === 'results');
  const watchedRobot = robots.find((r) => r.id === watchedId) ?? robots.find((r) => r.watched);

  const robotLook = useMemo(() => {
    if (phase === 'work' && workStage === 'watching') {
      return Object.fromEntries(robots.filter((r) => r.roomId).map((r) => [r.id, { pose: 'work', expression: 'neutral' }]));
    }
    if (showResults) {
      return Object.fromEntries(robots.filter((r) => r.result).map((r) => [r.id, {
        pose: 'idle', expression: r.result.score >= 4 ? 'happy' : r.result.score <= 2 ? 'worried' : 'neutral',
      }]));
    }
    return undefined;
  }, [phase, workStage, robots, showResults]);

  const valid = useMemo(() => getAvailableActions(state), [state]);
  const choices = useMemo(() => {
    if (!panelCheck) return [];
    return robots.map((robot) => {
      const enabled = valid.some((a) => a.type === 'INVESTIGATE' && a.check === panelCheck && a.robotId === robot.id);
      let reason = '';
      if (!enabled) {
        if (robot.status === 'unplugged') reason = 'Unplugged';
        else if (hud.ap <= 0) reason = 'No checks left';
        else if (checksToday.some((c) => c.robotId === robot.id && c.check === panelCheck)) reason = 'Checked today';
        else reason = 'Not available';
      }
      return { robot, enabled, reason };
    });
  }, [panelCheck, robots, valid, hud.ap, checksToday]);

  // ---- handlers ----
  const watchRobot = (robot) => {
    if (!picking || !robot?.roomId) return;
    play('step');
    setWatchedId(robot.id);
    setFocusId(null);
    setWorkStage('watching');
    dispatch({ type: 'STAND_IN', roomId: robot.roomId });
  };

  const onRoomClick = (roomId) => {
    if (picking) {
      const robot = robots.find((r) => r.roomId === roomId && r.status === 'active');
      if (robot) watchRobot(robot);
      return;
    }
    if (investigating) {
      const check = CHECK_BY_ROOM[roomId];
      if (!check || !UI_CHECKS.includes(check)) return;
      if (hud.ap <= 0) { play('error'); return; }
      play('click');
      setPanelCheck(check);
    }
  };

  const pickRobot = (robotId, enabled) => {
    if (!enabled) { play('error'); return; }
    play('check');
    dispatch({ type: 'INVESTIGATE', robotId, check: panelCheck });
    setPanelCheck(null);
    setFocusId(null);
  };

  const callMeeting = (confirmed) => {
    if (!investigating) { play('error'); return; }
    if (hud.ap > 0 && !confirmed) { play('click'); setConfirmMeeting(true); return; }
    setConfirmMeeting(false);
    play('alarm');
    dispatch({ type: 'CALL_MEETING' });
  };

  const closePanels = () => { setConfirmMeeting(false); setEvidenceOpen(false); };
  const closeCheck = useCallback(() => setPanelCheck(null), []);
  const closeSpread = useCallback(() => setEvidenceOpen(false), []);
  const closeObjective = useCallback(() => setObjOpen(false), []);

  // ---- dock: only the checks live here (everything else is one button in the centre) ----
  let dockTitle = '';
  let actions = [];
  if (investigating) {
    dockTitle = `Run a check · ${hud.ap} left today`;
    actions = UI_CHECKS.map((check) => {
      const m = CHECK_META[check];
      return {
        id: check, label: m.label, sub: `${roomName(m.room)} · ${m.shows}`, icon: m.icon, kind: 'check',
        disabled: hud.ap <= 0, reason: 'No checks left today', title: m.blurb,
        onClick: () => { if (hud.ap <= 0) { play('error'); return; } play('click'); setPanelCheck(check); },
      };
    });
  } else if (phase === 'task') dockTitle = 'Read today’s task';
  else if (picking) dockTitle = 'Pick a robot to watch';
  else if (phase === 'work' && workStage === 'watching') dockTitle = 'Watching…';
  else if (phase === 'work') dockTitle = 'Work report';

  const centreKey = phase === 'task' ? 'intro'
    : picking ? 'pick'
      : phase === 'work' && workStage === 'watching' ? 'watching'
        : phase === 'work' ? 'results'
          : 'investigate';

  // ---- tips: at most 2 in the whole game, one at a time, 8s each ----
  const calm = !panelCheck && !evidenceOpen && !objOpen;
  let wanted = null;
  if (calm && day === 1 && investigating && checksToday.length === 0 && hud.ap > 0) wanted = 'checks';
  else if (calm && day >= hud.maxDays && (centreKey === 'pick' || centreKey === 'investigate')) wanted = 'lastDay';
  useEffect(() => {
    if (!wanted) { setTip(null); return undefined; }
    if (!TIPS_SHOWN.has(wanted)) {
      if (TIPS_SHOWN.size >= TIP_LIMIT) return undefined;
      TIPS_SHOWN.add(wanted);
      activeTip.current = wanted;
      setTip(wanted);
    } else if (activeTip.current !== wanted) return undefined;
    const t = setTimeout(() => { activeTip.current = null; setTip(null); }, 8000);
    return () => clearTimeout(t);
  }, [wanted]);
  const dismissTip = useCallback(() => { activeTip.current = null; setTip(null); }, []);

  const firstBrief = day === 1
    ? `You’re the only human. One of these ${CAST.length} robots is cheating. Catch it within ${hud.maxDays} rounds.`
    : null;

  return (
    <div className={`game game--${phase}`} onClick={closePanels}>
      {/* ---------- scene ---------- */}
      <div className="game__scene">
        <Guarded
          name="HouseScene"
          component={HouseScene}
          fallback={<RoomGrid robots={sceneRobots} playerRoom={state.today?.playerRoom ?? null} activeRoomIds={activeRoomIds} onRoomClick={onRoomClick} focusRobotId={focusId} mood={mood} />}
          loading={<div className="game__loading tm-label">Unlocking the front door…</div>}
          robots={sceneRobots}
          playerRoom={state.today?.playerRoom ?? null}
          activeRoomIds={activeRoomIds}
          onRoomClick={onRoomClick}
          focusRobotId={focusId}
          robotLook={robotLook}
          mood={mood}
          gatherAtTable={state.phase === 'task'}
          insets={insets}
          onRobotClick={(id) => {
            if (picking) { const r = robots.find((x) => x.id === id); if (r) watchRobot(r); return; }
            setFocusId((f) => (f === id ? null : id));
          }}
        />
      </div>
      <div className="game__vignette" />

      {/* ---------- HUD ---------- */}
      <div className="game__hud">
        <div className="game__top">
          <div className="game__topLeft"><TaskCard scenario={scenario} day={day} /></div>
          <div className="game__topCentre">
            <DayCounter day={day} maxDays={hud.maxDays} />
            <div className="game__objRow">
              <CaseTag level={levelById(typeof hud.level === 'number' ? hud.level : hud.level?.id ?? level)} />
              <Objective
                open={objOpen}
                onToggle={() => { play('click'); setObjOpen((o) => !o); }}
                onClose={closeObjective}
                day={day}
                maxDays={hud.maxDays}
                homeHealth={hud.homeHealth}
                importantKeys={importantKeys}
                keysToWin={RULES.KEYS_TO_WIN}
              />
            </div>
            <div className="game__goalHint">
              <Hint id="lastDay" show={tip === 'lastDay'} onDismiss={dismissTip} arrow="up" tone="goal" tag="Last round">
                Unplug the cheater today or it wins.
              </Hint>
            </div>
          </div>
          <div className="game__topRight">
            <div className="game__health">
              <HealthMeter value={hud.homeHealth} />
              <div className="hchanges" aria-live="polite">
                <AnimatePresence>
                  {healthFeed.map((c) => (
                    <motion.div key={c.key} initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ opacity: 0, y: -10 }}>
                      <HealthChangeChip change={c} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        <div className="game__banner">
          <AnimatePresence mode="wait">
            {centreKey === 'investigate' && <InvestigateBanner key={`inv-${hud.ap > 0}`} ap={hud.ap} />}
          </AnimatePresence>
        </div>

        <div className="game__rail">
          <RobotRail robots={robots} keysById={keysById} showResults={showResults} focusId={focusId} onFocus={setFocusId} />
        </div>

        {/* centre overlays */}
        <AnimatePresence mode="wait">
          {centreKey === 'intro' && scenario && (
            <ScenarioIntro
              key={`intro-${day}`}
              scenario={scenario}
              day={day}
              maxDays={hud.maxDays}
              brief={firstBrief}
              onStart={() => dispatch({ type: 'START_WORK' })}
              onSkip={canSkip ? () => dispatch({ type: 'SKIP_TO_DECISION' }) : undefined}
            />
          )}
          {centreKey === 'pick' && (
            <div className="game__centre game__centre--low" key={`pick-${day}`}>
              <WatchPicker robots={robots} onWatch={watchRobot} onHover={setFocusId} />
            </div>
          )}
          {centreKey === 'watching' && (
            <div className="game__centreLow" key="watching">
              <WatchingBeat roomId={state.today?.playerRoom} robotName={watchedRobot?.name} onDone={() => setWorkStage('results')} />
            </div>
          )}
          {centreKey === 'results' && (
            <div className="game__centre" key={`results-${day}`}>
              <WorkResults robots={robots} healthChanges={healthChanges} onContinue={() => dispatch({ type: 'START_INVESTIGATION' })} />
            </div>
          )}
        </AnimatePresence>

        {/* latest check result, pinned open above the tray (no modal) */}
        <AnimatePresence mode="popLayout">
          {pinnedCard && (
            <motion.div key={pinnedCard.id} className="pinned" onClick={(e) => e.stopPropagation()} initial={{ y: 40, opacity: 0, rotate: 3 }} animate={{ y: 0, opacity: 1, rotate: -1 }} exit={{ y: 60, opacity: 0, scale: 0.6 }} transition={{ type: 'spring', stiffness: 300, damping: 24 }}>
              <div className="pinned__label">Latest result</div>
              <EvidenceCard card={pinnedCard} variant="pinned" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ---------- dock ---------- */}
        <motion.div
          className="game__dock"
          initial={{ y: 140 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 240, damping: 26, delay: 0.1 }}
          onClick={(e) => e.stopPropagation()}
        >
          <ApMeter ap={hud.ap} max={RULES.AP_PER_DAY} active={investigating} />
          <div className="game__dockActions">
            <DockActions title={dockTitle} actions={actions} />
            <Hint id="checks" show={tip === 'checks'} onDismiss={dismissTip} className="game__dockHint">
              Pick a check, then a robot. Camera shows what it really did; the test shows how it thinks.
            </Hint>
          </div>
          <div className="game__dockTray">
            <EvidenceTray cards={evidence} hiddenId={pinnedCard?.id} open={evidenceOpen} onToggle={() => { setConfirmMeeting(false); setEvidenceOpen((o) => !o); }} />
          </div>
          <div className="game__dockMeeting">
            <CallMeetingButton enabled={investigating} apLeft={hud.ap} confirming={confirmMeeting} onClick={callMeeting} onCancel={() => setConfirmMeeting(false)} />
          </div>
        </motion.div>
      </div>

      {/* ---------- modal layers ---------- */}
      <CheckPanel check={panelCheck} choices={choices} ap={hud.ap} onPick={pickRobot} onClose={closeCheck} onHover={setFocusId} />
      <EvidenceSpread cards={evidence} open={evidenceOpen} onClose={closeSpread} />

      <AnimatePresence>
        {toast && (
          <motion.div key={toast} className="game__toast" initial={{ x: '-50%', y: 30, opacity: 0 }} animate={{ x: '-50%', y: 0, opacity: 1 }} exit={{ x: '-50%', y: 20, opacity: 0 }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
