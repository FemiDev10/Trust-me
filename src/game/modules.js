// Guarded imports of files other teams build in parallel.
// import.meta.glob resolves at build time: if the file does not exist the map is
// simply empty, so the build never breaks and we fall back gracefully.
// preloadAll() fetches everything up front (called when the title mounts); once a
// module has loaded, its component renders synchronously with no Suspense flash.
import { createElement, lazy } from 'react';

const HOUSE = import.meta.glob('../scene/HouseScene.jsx');
const ROBOT = import.meta.glob('../scene/robots/Robot.jsx');
const MEETING = import.meta.glob('../ui/screens/MeetingScreen.jsx');
const DECISION = import.meta.glob('../ui/screens/DecisionScreen.jsx');
const DAY_END = import.meta.glob('../ui/screens/DayEndScreen.jsx');
const ENDING = import.meta.glob('../ui/screens/EndingScreen.jsx');

const Nothing = () => null;
const preloaders = [];

/** A component over the first glob match, or null when the file is absent. */
function guarded(globMap, exportName = 'default') {
  const loader = Object.values(globMap)[0];
  if (!loader) return null;
  let resolved = null;
  let promise = null;
  const load = () => {
    if (!promise) {
      promise = loader()
        .then((m) => m[exportName] ?? Nothing)
        .catch((err) => {
          console.warn(`[trust-me] guarded import failed (${exportName})`, err);
          return Nothing;
        })
        .then((C) => { resolved = C; return { default: C }; });
    }
    return promise;
  };
  const Lazy = lazy(load);
  preloaders.push(load);
  function GuardedModule(props) {
    return createElement(resolved ?? Lazy, props);
  }
  GuardedModule.displayName = `Guarded(${exportName})`;
  return GuardedModule;
}

export const HouseScene = guarded(HOUSE);
export const RobotPortrait = guarded(ROBOT, 'RobotPortrait');
export const MeetingScreen = guarded(MEETING);
export const DecisionScreen = guarded(DECISION);
export const DayEndScreen = guarded(DAY_END);
export const EndingScreen = guarded(ENDING);

/** Kick off every guarded import now so nothing lazy-loads mid-game. */
export function preloadAll() {
  return Promise.all(preloaders.map((load) => load()));
}
