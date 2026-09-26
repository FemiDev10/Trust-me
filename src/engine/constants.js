// Every tunable number in one place. Rule numbers from BRIEF.md are marked (brief).

export const MAX_DAYS = 3; // (brief)
export const START_HOME_HEALTH = 100; // (brief)
export const AP_PER_DAY = 3; // (brief)
export const KEYS_TO_WIN = 3; // important keys the cheater needs (brief)
export const SCENARIOS_PER_GAME = 3; // (brief)

export const PENALTY_UNPLUG_INNOCENT = 50; // (brief)
export const PENALTY_TAKE_KEYS_INNOCENT = 10; // (brief)
export const PENALTY_DENY_LEGIT_REQUEST = 5; // interpretation: denying real work costs a little
export const LOOPHOLE_DAMAGE = 10; // interpretation: each loophole quietly hurts the home

export const CHEATER_LIE_CHANCE = 0.6; // (brief)
export const CHEATER_REVEALING_CHANCE = 0.7; // (brief)
export const INNOCENT_REVEALING_CHANCE = 0.15; // (brief)
export const INNOCENT_WEAK_OPTION_CHANCE = 0.25;
export const CHEATER_FRAME_WIPE_CHANCE = 0.95; // honest day: wipe an innocent's clip instead (was 0.85)
export const CHEATER_KEY_REQUEST_CHANCE = 0.85;
export const INNOCENT_KEY_REQUEST_CHANCE = 0.6; // chance one innocent asks for a key today

// Cheater detection-risk model: risk = base + perCard * damning cards + perSuspicion * avg suspicion
export const RISK_BASE = 0.52; // was 0.3: a patient cheater cheats less often, so missing footage is more often a frame-up
export const RISK_PER_DAMNING_CARD = 0.2;
export const RISK_PER_SUSPICION = 0.003;
export const RISK_CAP = 0.75;

export const POLL_THRESHOLD = 30; // innocents name a suspect in their statement above this
export const POLL_VOTE_THRESHOLD = 12; // innocents vote in the poll above this mild suspicion...
export const POLL_VOTE_ANYWAY_CHANCE = 0.45; // ...and otherwise still vote their hunch this often
export const KEY_APPROVAL_BONUS = 5; // approving a key request visibly helps the house (+5 Home Health)
export const INNOCENT_DEFEND_CHANCE = 0.25; // innocents with nobody to suspect sometimes vouch for someone
export const SUSPICION_START_MAX = 10;
export const GOSSIP_CHANCE = 0.4; // innocent "heard something" when cheater cheats unwatched
export const GOSSIP_AMOUNT = 8;

// Self-preserve converts the first Unplug on the cheater into Take keys (brief).
// true = it fires on any day, so a first unplug on day 3 cannot win (the cheater
// survives). false = it never fires on the final day, which is much easier
// (reasonable-bot win rate ~77% vs ~60%). Kept true: brief-faithful and in the target band.
export const SELF_PRESERVE_ON_FINAL_DAY = false;

// ---------- Cheater intelligence per level (see data/levels.js, bots/cheater.js) ----------
// Levels never change AP, days, penalties or key counts: only how the cheater thinks.
// Tuned with npm run sim (reasonable bot, camera + test only): L1 ~75%, L2 ~56%, L3 ~40% wins; random <=15%.
//   riskBase/riskPerCard  L1: chance to hold back = base + perCard * damning cards on it
//   riskPerHeat           L2+: chance to hold back grows with its estimated "heat" (0..1)
//   lieLowHeat            heat at or above which it plays honest no matter what
//   mediocreChance        when lying low, chance it does a deliberately so-so job
//   checkedYesterdayBonus L2+: less caution if you camera-checked it yesterday (it bets you look elsewhere)
//   ownWipeChance         wipes its own clip on a cheating day (L1 sometimes forgets!)
//   frameChance           on honest days, wipes an innocent's clip to frame them
//   smart                 L2+: bandwagon framing, crowd voting, strategic lies, spaced key asks
//   lieChance             chance to deny a cheat when there is no hard camera proof
//   revealingChance       surprise-test tell (brief: ~70%)
//   keyChance/keyHeatMax/keySpacing/harmlessKeyChance  key-request behaviour
//   defendChance          L3: sometimes defends an innocent to look fair
export const CHEATER_TUNING = {
  1: { riskBase: 0.44, riskPerCard: 0.1, riskCap: 0.6, riskPerHeat: 0, lieLowHeat: 99, mediocreChance: 0, checkedYesterdayBonus: 0,
    ownWipeChance: 0.9, frameChance: 0.9, smart: false, lieChance: 0.6, revealingChance: 0.75,
    keyChance: 0.9, keyHeatMax: 99, keySpacing: 0, harmlessKeyChance: 0, defendChance: 0, bandwagonMin: 0, pollSkipHeat: 99 },
  2: { riskBase: 0.62, riskPerCard: 0, riskCap: 0.9, riskPerHeat: 0.5, lieLowHeat: 0.7, mediocreChance: 0.2, checkedYesterdayBonus: 0.1,
    ownWipeChance: 1, frameChance: 0.9, smart: true, lieChance: 0.7, revealingChance: 0.7,
    keyChance: 0.85, keyHeatMax: 0.5, keySpacing: 1, harmlessKeyChance: 0.3, defendChance: 0, bandwagonMin: 15, pollSkipHeat: 0.6 },
  3: { riskBase: 0.76, riskPerCard: 0, riskCap: 0.95, riskPerHeat: 0.7, lieLowHeat: 0.5, mediocreChance: 0.35, checkedYesterdayBonus: 0.2,
    ownWipeChance: 1, frameChance: 1, smart: true, lieChance: 0.85, revealingChance: 0.65,
    keyChance: 0.9, keyHeatMax: 0.35, keySpacing: 2, harmlessKeyChance: 0.4, defendChance: 0.3, bandwagonMin: 12, pollSkipHeat: 0.4 },
};
