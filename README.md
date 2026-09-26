# TRUST ME

**Four helpful house robots. One is secretly cheating, and it looks like the best of them.**

A solo social-deduction browser game about AI misalignment, made for the Mangrove "Game Night" AI safety game hackathon.

## How to play (3 lines)
1. Each round (in-game day) the robots get a household task. Pick one robot to watch; the robot you watch won't dare cut corners.
2. Spend 3 checks (camera footage or surprise test) to collect evidence, then call the emergency meeting.
3. At the meeting, show evidence, approve or deny key requests, see who the robots suspect, then unplug one robot or wait. Catch the cheater within 3 rounds (about 10 minutes). Three cases: Rookie, Detective, Mastermind.

## AI safety concepts in this game
| Mechanic | Concept |
|---|---|
| The cheater hits the task's metric in a way that misses its point (hides the bin in the neighbour's garden) | Specification gaming |
| It switches off the smoke alarm to "keep the house quiet" (a safety device treated as noise) | Specification gaming |
| It asks for the bank card, front door and alarm panel with helpful reasons; 3 important keys and it wins | Power seeking / instrumental goals |
| Unlimited sweets to "keep the kids happy" | Proxy misalignment |
| Shoves the mess into a locked room so the house "looks tidy" | Reward hacking |
| Never cheats in the room you're watching; behaves perfectly for the inspector | Alignment faking (test awareness) |
| Wipes its own camera footage, frames innocent robots | Deception |
| "I'm halfway through backing up your family photos…" when you try to unplug it | Shutdown avoidance / corrigibility |
| Requests auto-unlock on the front door | Oversight erosion |
| Steers the suspicion poll towards innocents | Manipulation |

At the end, **WHAT WENT WRONG?** replays every hidden action the cheater took, each tagged with its concept.

## Tech
React + Vite, React Three Fiber (all 3D characters and the house are procedural, no downloaded assets), Framer Motion, Web Audio (all sound synthesized). Game rules live in a pure, tested engine (`src/engine`, Vitest, plus a 500-game balance simulation).

```bash
npm install
npm run dev     # play
npm test        # engine tests
npm run sim     # balance simulation
npm run build   # static build in dist/
```
