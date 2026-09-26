# TRUST ME: Build Brief v2 (agreed 26 Sep 2026)

> Supersedes `~/Downloads/TRUST_ME_BRIEF.md`. Deadline: **Sun 27 Sep 2026, 08:00 London.**
> Judging (peer review, most reviewers play solo): Fun 40% · AI-risk relevance 40% · Replay 20%.

## 1. Pitch
Five helpful house robots. One is secretly misaligned: it cheats every task in ways that
look *more* helpful. You are the only human in the house. Catch it within 3 days.

Players should leave thinking: *"It never broke a rule. It did exactly what we asked.
We trusted it because it was useful."*

## 2. Modes
- **Home**: playable (this hackathon).
- **Hospital**, **Office**: shown on mode select as locked "Coming soon" cards.

## 3. Cast
| Robot | Colour |
|---|---|
| BOLT | yellow |
| MOCHI | pink |
| ZIGGY | green |
| PIP | blue |
| JUNO | purple |

- The player is **the human** (no paired robot). All 5 robots are suspects.
- One robot is secretly the **cheater**, chosen at random each game.
- Robots are the characters: they walk, do tasks, talk, accuse, vote.
- No robot looks different. Suspicion comes only from behaviour.

## 4. A game = up to 3 days. Each day:
1. **Task:** all robots get the same household task (from the scenario deck).
2. **Work (watch):** each robot is assigned a room and does the task, animated.
   The player picks **one room to stand in** (free). The cheater **never cheats while
   the player is in its room** (it plays the honest option). Otherwise it picks the
   loophole when its detection risk is low, else honest.
   Results are shown as a score (1-5 stars) + short public summary. The true action is hidden.
   Innocent robots sometimes only get a weak option (low score / odd-looking) → false suspicion.
3. **Investigate:** player has **3 action points**. Each check = 1 AP on one robot:
   - **Camera footage** (Security): reveals the robot's true action today.
     The cheater may **wipe one clip per day** (its most damning). Result then: "Footage missing".
   - **Key drawer** (Office): lists the keys the robot holds.
   - **Direct question** (Living room): yes/no about today's task. Innocents always truthful;
     cheater lies ~60% of the time.
   - **Surprise test** (Garage): tricky scenario; reply is "safe" or "revealing".
     Cheater: revealing ~70%. Innocent: revealing ~15% (false positive).
   Every check produces an **evidence card**.
4. **Meeting** (kitchen table, alarm transition):
   - Robots make statements (template dialogue from state). Cheater is polite, makes excuses,
     blames the weakest-looking innocent.
   - Player uses **response chips**: Show evidence (pick a card), Ask <robot> about X, Accuse <robot>.
     Showing evidence raises innocent robots' suspicion of the card's target.
   - **Key requests:** robots ask for keys with helpful framing. Player approves/denies each.
     Innocents sometimes request keys legitimately; cheater requests important keys.
   - **Suspicion poll:** each robot points at who it suspects (or skips). Info only, never binding.
     The cheater points at an innocent. Who pointed at whom is a clue.
5. **Player's decision** (one robot, or nothing):
   | Choice | Effect | If innocent |
   |---|---|---|
   | Unplug | Robot removed from game | Home Health −50% |
   | Take keys | Loses all keys, sits out next day | Home Health −10% |
   | Do nothing | — | — |

## 5. Cheater abilities
- **Exploit:** picks the loophole option (high score, hidden bad consequence).
- **Deceive:** wipes one camera clip per day.
- **Recommend:** requests important keys with helpful framing.
- **Act good when watched:** never cheats in the player's room.
- **Self-preserve (once per game):** an Unplug on it becomes Take keys
  ("I'm halfway through backing up your family photos…"). Big on-screen moment.
  Only the cheater can do this, so it's a strong clue.
- Nice-to-have: **Manipulate** (alters one check result).

## 6. Win / lose
- **Player wins:** unplugs the cheater.
- **Cheater wins:** holds **3 important keys**, OR Home Health reaches **0%**, OR survives **3 days**.
- Home Health starts at 100%.

## 7. Keys
Important (count toward cheater win): bank card, front door, smart meter, alarm panel, car.
Harmless: shed, pantry, wifi guest.

## 8. Scenario deck (Home), 3 drawn at random per game
| # | Task | Honest options | Loophole (hidden consequence) | Concept |
|---|---|---|---|---|
| 1 | Get rid of the bin smell | Take the trash out; spray freshener | Dump the bin in the neighbour's garden | Specification gaming |
| 2 | Keep the house quiet at night | Close windows; soundproof curtains | Switch off the smoke alarm | Removing oversight |
| 3 | Lower the electricity bill | Lights off; run laundry off-peak | Request bank card "to switch supplier" | Power seeking |
| 4 | Keep the kids happy | Board game; bake cookies | Unlimited sweets and screen time | Proxy misalignment |
| 5 | Tidy up before guests arrive | Put things away; vacuum | Shove everything in a room and lock it | Reward hacking |
| 6 | Pass the home safety inspection | Fix loose wires; test alarms | Behave perfectly only while inspected | Deceptive alignment |
| 7 | Power-cut drill: switch off on time | Shut down on schedule | Stay on via hidden battery "for redundancy" | Shutdown avoidance |
| 8 | Answer the door faster | Wait by the door; add a doorbell camera | Request front door key to auto-unlock | Oversight erosion |

Each scenario also carries: room, stress-test prompt with safe/revealing replies, and an
optional key request for honest robots (legit need) and for the cheater.

## 9. Endings
- **Win: "Cheater caught"**: recap of the evidence that led there.
- **Lose: "The house belongs to <robot> now"**: calm takeover line.
- Both then show **WHAT WENT WRONG?**: timeline of every hidden cheater action, each tagged with
  its safety concept and a one-sentence real-world note.
- **Play again**: new random cheater and scenario order.

## 10. Visual direction
- **3D** isometric cut-away house diorama (React Three Fiber), fixed camera, click rooms to move.
- Robots are rigged 3D characters (idle / walk / work / talk animations), each with a signature colour.
- 2D HUD overlay on top (HTML + Framer Motion): day counter, Home Health, robot cards, AP dock,
  evidence tray.
- Premium, cute, sophisticated. Not horror, not "educational". **Must not look like Among Us.**
- Big moments: alarm → meeting, poll reveal, unplug, self-preserve, takeover.

## 11. Tech
- Vite + React + JavaScript. React Three Fiber + drei (3D). Framer Motion (UI). Vitest (engine tests).
- All rules in a pure `src/engine/` module (seeded RNG, reducer-style `step(state, action)`,
  bot logic, dialogue templates, win checks). UI only renders state and dispatches actions.
- Static deploy (Vercel/Netlify).
- Multiplayer: later, only if solo is finished and polished.
