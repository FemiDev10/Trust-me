// App shell: routes by screen (title, level select) and then by engine phase.
// Flow: title -> OPEN THE CASE -> straight into Case N, Day 1 (START is automatic).
// `/?debug` keeps the bare engine debug UI for testing.
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import DebugGame from './debug/DebugGame.jsx';
import { useGame } from './game/useGame.js';
import { MeetingScreen, DecisionScreen, DayEndScreen, EndingScreen, preloadAll } from './game/modules.js';
import { play, music } from './game/sound.js';
import Guarded from './ui/shell/Guarded.jsx';
import PhaseFallback from './ui/shell/PhaseFallback.jsx';
import CornerControls from './ui/shell/CornerControls.jsx';
import HowToPlay from './ui/help/HowToPlay.jsx';
import TitleScreen from './ui/screens/TitleScreen.jsx';
import { LevelSelect } from './ui/screens/ModeSelectScreen.jsx';
import { LEVELS, markSolved, nextLevel, isUnlocked, isSolved } from './game/levels.js';
import { saveGame, loadGame, clearSave } from './game/save.js';
import GameScreen from './ui/screens/GameScreen.jsx';

const isDebug = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug');

// U2's screens, each with a playable fallback if the file is missing or crashes.
const PHASE_SCREENS = { meeting: MeetingScreen, decision: DecisionScreen, dayEnd: DayEndScreen, ending: EndingScreen };

/** task/work/investigate share one GameScreen so the house scene persists. */
const routeKey = (screen, state) => {
  if (!state) return screen;
  if (['roleReveal', 'task', 'work', 'investigate'].includes(state.phase)) return 'play';
  // U2 screens remount per phase and day.
  return `${state.phase}-${state.day}`;
};

// Quick crossfade (no wait gap, no filters). Both screens overlap briefly.
/** Background music mood for the current screen/phase. */
function musicMood(state) {
  if (!state) return 'title';
  switch (state.phase) {
    case 'roleReveal': case 'task': case 'work': return 'day';
    case 'investigate': return 'investigate';
    case 'meeting': return 'meeting';
    case 'decision': case 'dayEnd': return 'decision';
    case 'ending': return state.ending?.result === 'win' ? 'win' : 'lose';
    default: return null;
  }
}

const screenMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, pointerEvents: 'none' },
  transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
};

function GameApp() {
  const { state, dispatch, newGame, quit, level, resume } = useGame();
  const [saved, setSaved] = useState(() => loadGame());
  const [screen, setScreen] = useState('title');
  const phase = state?.phase ?? null;
  const [helpOpen, setHelpOpen] = useState(false);
  const openHelp = () => setHelpOpen(true);

  const mood = musicMood(state);
  useEffect(() => { music(mood); }, [mood]);

  // Fetch every guarded module (house, robots, U2 screens) while the title is up.
  useEffect(() => { preloadAll(); }, []);

  // Phase-level sound cues.
  const prevPhase = useRef(null);
  useEffect(() => {
    if (phase === 'task' && prevPhase.current !== 'task') play('dayStart');
    prevPhase.current = phase;
  }, [phase, state?.day]);

  // No dossier screen: the role brief lives on the Day 1 task card, so START is automatic.
  useEffect(() => { if (phase === 'roleReveal') dispatch({ type: 'START' }); }, [phase, dispatch]);

  // Persist after every step; a finished game clears the save.
  useEffect(() => {
    if (!state) return;
    if (state.phase === 'ending') { clearSave(); setSaved(null); } else saveGame(state, level);
  }, [state, level]);

  // A won case unlocks the next level.
  const won = phase === 'ending' && state?.ending?.result === 'win';
  useEffect(() => { if (won) markSolved(level); }, [won, level]);

  // OPEN THE CASE: the first unlocked case not yet solved (Case 1 for new players).
  const firstOpen = LEVELS.find((l) => isUnlocked(l.id) && !isSolved(l.id)) ?? LEVELS[LEVELS.length - 1];
  const anySolved = LEVELS.some((l) => isSolved(l.id));
  const openCase = () => { clearSave(); setSaved(null); newGame(undefined, firstOpen.id); };
  const continueCase = saved ? () => resume(saved.state, saved.level) : undefined;
  const playAgain = () => newGame(undefined, level);
  const next = won ? nextLevel(level) : null;
  const playNext = next ? () => { markSolved(level); newGame(undefined, next.id); } : undefined;
  const quitToTitle = () => { quit(); setSaved(loadGame()); setScreen('title'); };
  const key = routeKey(screen, state);

  let content;
  if (!state) {
    content = screen === 'level'
      ? <LevelSelect onPick={(id) => { clearSave(); setSaved(null); newGame(undefined, id); }} onBack={() => setScreen('title')} />
      : (
        <TitleScreen
          onEnter={openCase}
          onContinue={continueCase}
          continueLabel={saved ? `Case ${saved.level} · Day ${saved.state.day}` : undefined}
          onCases={anySolved ? () => setScreen('level') : undefined}
          caseLabel={`Case ${firstOpen.id} · ${firstOpen.name}`}
          onHelp={openHelp}
        />
      );
  } else if (key === 'play' && phase === 'roleReveal') {
    content = <div className="tm-screen" />;
  } else if (key === 'play') {
    content = <GameScreen state={state} dispatch={dispatch} level={level} />;
  } else {
    const fallback = <PhaseFallback state={state} dispatch={dispatch} onPlayAgain={playAgain} onNextLevel={playNext} />;
    content = (
      <Guarded
        key={`${phase}-${state.day}`}
        name={`${phase} screen`}
        component={PHASE_SCREENS[phase]}
        fallback={fallback}
        loading={null}
        state={state}
        dispatch={dispatch}
        onPlayAgain={playAgain}
        onNextLevel={playNext}
        onQuit={quitToTitle}
      />
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className={`tm-app tm-app--${key === 'play' ? 'play' : phase ?? screen} ${phase ? 'tm-app--ingame' : ''}`}>
        <AnimatePresence initial={false}>
          <motion.div key={key} className="tm-screen" {...screenMotion}>
            {content}
          </motion.div>
        </AnimatePresence>
        <CornerControls onHelp={openHelp} showHelp={Boolean(phase)} onQuit={phase && phase !== 'ending' ? quitToTitle : undefined} />
        <HowToPlay open={helpOpen} onClose={() => setHelpOpen(false)} />
      </div>
    </MotionConfig>
  );
}

if (isDebug) document.body.classList.add('tm-debug');

export default function App() {
  return isDebug ? <DebugGame /> : <GameApp />;
}
