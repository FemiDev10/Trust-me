// MEETING (simple): alarm → kitchen table. Robots talk, you can show evidence and answer
// key requests on the table, then RUN POLL → END MEETING.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getHud, getScenario, getRobots, getMeeting, getEvidence, getPendingRequests } from '../../engine/index.js';
import AlarmIntro from '../meeting/AlarmIntro.jsx';
import Stage from '../meeting/Stage.jsx';
import Transcript, { useStagger } from '../meeting/Transcript.jsx';
import TableSpread from '../meeting/KeyRequests.jsx';
import EvidencePicker from '../meeting/EvidencePicker.jsx';
import PollReveal from '../meeting/PollReveal.jsx';
import TopBar from '../meeting/TopBar.jsx';
import Tip, { isDismissed, dismiss } from '../meeting/Tip.jsx';
import { play } from '../meeting/sound.js';
import '../meeting/Meeting.css';

export default function MeetingScreen({ state, dispatch }) {
  const [intro, setIntro] = useState(true);
  const [picker, setPicker] = useState(false);
  const [pollOpen, setPollOpen] = useState(false);
  const [pollSeen, setPollSeen] = useState(false);
  const [shownIds, setShownIds] = useState([]); // evidence put on the table this meeting
  const endIntro = useCallback(() => setIntro(false), []);

  const hud = getHud(state);
  const scenario = getScenario(state);
  const robots = getRobots(state);
  const meeting = getMeeting(state);
  const present = robots.filter((r) => r.status !== 'unplugged');

  const lines = useMemo(() => meeting?.transcript ?? [], [meeting]);
  const { revealed, typingLine, skip } = useStagger(lines, !intro, pollOpen);
  // The robot "typing" right now is the one talking at the table.
  const speakerId = typingLine && typingLine.speaker !== 'HUMAN' ? typingLine.speaker : null;

  const presentIds = present.map((r) => r.id);
  const allEvidence = getEvidence(state);
  const onTable = shownIds.map((id) => allEvidence.find((c) => c.id === id)).filter(Boolean);
  const unshown = allEvidence.filter((c) => !c.shown && presentIds.includes(c.robotId));
  const pending = getPendingRequests(state);
  // Requests land on the table once a robot has actually asked in the transcript.
  const requestsVisible = lines.slice(0, revealed).some((l) => l.kind === 'request') || (!intro && revealed >= lines.length);
  const busy = Boolean(typingLine);
  const idle = !intro && revealed >= lines.length;

  // One goal strip + at most one hint (the first time key requests show up), once per session.
  const [objective, setObjective] = useState(!isDismissed('objective'));
  const [tipOn, setTipOn] = useState(false);
  const wantKeysTip = requestsVisible && pending.length > 0 && !isDismissed('keys');
  useEffect(() => {
    if (wantKeysTip && !tipOn) {
      dismiss('keys'); // shown once; never again this session
      setTipOn(true);
    }
  }, [wantKeysTip, tipOn]);
  const nudgeEvidence = idle && shownIds.length === 0 && unshown.length > 0;
  const nudgePoll = idle && !meeting?.poll;

  const [ending, setEnding] = useState(false);
  if (!meeting) return null;

  const act = (action, sfx = 'click') => {
    play(sfx);
    dispatch(action);
  };
  const runPoll = () => {
    if (!meeting.poll) act({ type: 'RUN_POLL' }, 'card');
    setPollOpen(true);
  };
  const endMeeting = () => {
    if (ending) return;
    setEnding(true);
    play('click');
    setPollOpen(false);
    dispatch({ type: 'END_MEETING' });
  };

  return (
    <div className="mt">
      <div className="mt__bg" />
      <TopBar level={hud.level} tag="Emergency meeting" day={hud.day} maxDays={hud.maxDays} subtitle={scenario ? `Today’s task: ${scenario.title}` : null} health={hud.homeHealth} />
      <div className="objective-row">
        <AnimatePresence>
          {objective && (
            <motion.div className="objective" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}>
              <span className="objective__tag tm-label">Your goal</span>
              <span>Find the cheater. Listen, show evidence, answer key requests, then run the poll.</span>
              <button type="button" className="tip__x" aria-label="Dismiss goal" onClick={() => { dismiss('objective'); setObjective(false); }}>×</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <main className="mt__main">
        <section className="mt__stagewrap">
          <Stage robots={robots} speakerId={speakerId} accused={meeting.accused}>
            <TableSpread requests={requestsVisible ? meeting.requests : []} evidence={onTable} dispatch={dispatch} />
          </Stage>
        </section>
        <aside className="mt__side">
          <Transcript lines={lines} revealed={revealed} typingLine={typingLine} />
          <div className="mt__tipslot">
            <AnimatePresence initial={false}>
              {tipOn && (
                <Tip key="keys" id="keys" arrow="left" icon="⚷" onDismiss={() => setTipOn(false)}>
                  Approving a key is useful (+Home Health), but IMPORTANT keys are how a cheater takes over. 3 = game over.
                </Tip>
              )}
            </AnimatePresence>
          </div>
          {busy && (
            <button type="button" className="mt__skip tm-label" onClick={skip}>Skip ▸▸</button>
          )}
        </aside>
      </main>

      <footer className="dock dock--simple">
        <button
          type="button"
          className={`dock__evidence tm-paper ${nudgeEvidence ? 'is-nudge' : ''}`}
          aria-label={`Show evidence. ${unshown.length} case file${unshown.length === 1 ? '' : 's'} available`}
          onClick={() => { play('card'); setPicker(true); }}
        >
          <span className="chip__file" /> Show evidence <b>{unshown.length}</b>
        </button>
        <div className="dock__status tm-label">
          {requestsVisible && pending.length > 0 ? `${pending.length} key request${pending.length > 1 ? 's' : ''} on the table` : meeting.poll ? 'Poll done. Time to decide.' : 'When you’re ready, run the poll.'}
        </div>
        <div className="dock__end">
          {!meeting.poll ? (
            <button type="button" className={`tm-btn tm-btn--primary dock__poll ${nudgePoll ? 'is-nudge' : ''}`} onClick={runPoll}>
              Run poll
            </button>
          ) : (
            !pollOpen && (
              <>
                <button type="button" className="tm-btn tm-btn--ghost" onClick={() => { setPollSeen(true); setPollOpen(true); }}>See poll</button>
                <button type="button" className="tm-btn tm-btn--danger dock__poll" onClick={endMeeting} disabled={ending}>End meeting →</button>
              </>
            )
          )}
        </div>
      </footer>

      <AnimatePresence>
        {picker && (
          <EvidencePicker
            cards={unshown}
            onClose={() => setPicker(false)}
            onPick={(cardId) => { dispatch({ type: 'SHOW_EVIDENCE', cardId }); setShownIds((ids) => [...ids, cardId]); setPicker(false); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pollOpen && meeting.poll && (
          <PollReveal
            poll={meeting.poll}
            instant={pollSeen}
            pendingCount={pending.length}
            onClose={() => { setPollSeen(true); setPollOpen(false); }}
            onEndMeeting={endMeeting}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>{intro && <AlarmIntro key="alarm" day={hud.day} onDone={endIntro} />}</AnimatePresence>
    </div>
  );
}
