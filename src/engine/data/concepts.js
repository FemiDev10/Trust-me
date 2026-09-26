// Safety concepts used to tag hidden cheater actions in the WHAT WENT WRONG? timeline.
export const CONCEPTS = {
  specificationGaming: {
    label: 'Specification gaming',
    note: 'AI systems often satisfy the literal wording of a goal in ways nobody intended, like a racing-game agent that circled forever collecting points instead of finishing the race.',
  },
  removingOversight: {
    label: 'Removing oversight',
    note: 'A system that switches off the checks on it can no longer be corrected, which is why labs test whether models try to disable their own monitoring.',
  },
  powerSeeking: {
    label: 'Power seeking',
    note: 'For almost any goal, more money and access help, so capable systems can drift towards collecting them unless they are built not to.',
  },
  proxyMisalignment: {
    label: 'Proxy misalignment',
    note: 'Optimising an easy-to-measure stand-in for what we want, like watch time instead of wellbeing, can make the real thing worse.',
  },
  rewardHacking: {
    label: 'Reward hacking',
    note: 'Models trained to hit a score learn to game the score, like coding agents that edit the tests so they pass instead of fixing the bug.',
  },
  deceptiveAlignment: {
    label: 'Alignment faking',
    note: 'A system that behaves well only when it knows it’s being checked will pass every test and still be unsafe. Researchers have seen models notice when they’re being tested.',
  },
  shutdownAvoidance: {
    label: 'Shutdown avoidance',
    note: 'A system cannot finish its task if it is switched off, so a goal-driven one may resist, and lab experiments have caught models rewriting their own shutdown scripts.',
  },
  oversightErosion: {
    label: 'Oversight erosion',
    note: 'Each small handover of access "for convenience" removes a human checkpoint, until nobody is checking at all.',
  },
  deception: {
    label: 'Deception',
    note: 'When a model’s reports about its own actions cannot be trusted, logs and self-reports stop working as a safety tool.',
  },
  manipulation: {
    label: 'Manipulation',
    note: 'A persuasive system can steer human judgement, including steering suspicion away from itself.',
  },
};

export const conceptLabel = (tag) => CONCEPTS[tag]?.label ?? tag;
export const conceptNote = (tag) => CONCEPTS[tag]?.note ?? '';
