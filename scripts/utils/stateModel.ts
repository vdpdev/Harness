export const TICKET_FSM = {
  kind: 'ticket',
  states: ['open', 'inProgress', 'done'],
  // Verdict subspace — not a transition target, just documented metadata the
  // model carries so `--stateModel` can render it.
  verdicts: [],
  transitions: [
    { from: 'open', to: 'inProgress', command: 'claim', guard: 'blockersResolved' },
    { from: 'inProgress', to: 'inProgress', command: 'claim' },
    { from: 'open', to: 'done', command: 'done', guard: 'blockersResolved' },
    { from: 'inProgress', to: 'done', command: 'done', guard: 'blockersResolved' },
    { from: 'inProgress', to: 'open', command: 'release' },
    { from: 'open', to: 'open', command: 'release' },
  ],
};
export const RUNARTIFACTS_FSM = {
  kind: 'runartifacts',
  states: ['pending', 'inProgress', 'reviewed'],
  // Verdict subspace set at `done` (inferred from whether the review produced
  // any tickets): clean | ticketed.
  verdicts: ['clean', 'ticketed'],
  transitions: [
    { from: 'pending', to: 'inProgress', command: 'claim' },
    { from: 'inProgress', to: 'inProgress', command: 'claim' },
    { from: 'pending', to: 'inProgress', command: 'next' },
    { from: 'inProgress', to: 'reviewed', command: 'done' },
    { from: 'pending', to: 'reviewed', command: 'done' },
    { from: 'reviewed', to: 'reviewed', command: 'done' },
    { from: 'reviewed', to: 'pending', command: 'release' },
    { from: 'inProgress', to: 'pending', command: 'release' },
  ],
};
export const COVERAGE_FSM = {
  kind: 'coverage',
  states: ['pending', 'inProgress', 'reviewed'],
  // Verdict subspace set at `done`: improved (strengthened in place or new cases
  // added), clean (reviewed, no change needed), ticketed (graduated to a real
  // tickets.json finding).
  verdicts: ['improved', 'clean', 'ticketed'],
  transitions: [
    { from: 'pending', to: 'inProgress', command: 'claim' },
    { from: 'inProgress', to: 'inProgress', command: 'claim' },
    { from: 'pending', to: 'inProgress', command: 'next' },
    { from: 'inProgress', to: 'reviewed', command: 'done' },
    { from: 'pending', to: 'reviewed', command: 'done' },
    { from: 'reviewed', to: 'reviewed', command: 'done' },
    { from: 'reviewed', to: 'pending', command: 'release' },
    { from: 'inProgress', to: 'pending', command: 'release' },
  ],
};
export const DOGFOOD_FSM = {
  kind: 'dogfood',
  states: ['pending', 'inProgress', 'reviewed'],
  verdicts: ['clean', 'ticketed'],
  transitions: [
    { from: 'pending', to: 'inProgress', command: 'claim' },
    { from: 'inProgress', to: 'inProgress', command: 'claim' },
    { from: 'pending', to: 'inProgress', command: 'next' },
    { from: 'inProgress', to: 'reviewed', command: 'done' },
    { from: 'pending', to: 'reviewed', command: 'done' },
    { from: 'reviewed', to: 'reviewed', command: 'done' },
    { from: 'reviewed', to: 'pending', command: 'release' },
    { from: 'inProgress', to: 'pending', command: 'release' },
  ],
};
export const MODELS = {
  ticket: TICKET_FSM,
  runartifacts: RUNARTIFACTS_FSM,
  coverage: COVERAGE_FSM,
  dogfood: DOGFOOD_FSM,
};
export const commandOrder = ['claim', 'next', 'done', 'release'];

// Extracted functions (single-responsibility modules)
export { getModel } from './stateModel/get-model.js';
export { evaluateGuard } from './stateModel/evaluate-guard.js';
export { transitionsFrom } from './stateModel/transitions-from.js';
export { canTransition } from './stateModel/can-transition.js';
export { sortCommands } from './stateModel/sort-commands.js';
export { formatStateTransitions } from './stateModel/format-state-transitions.js';
export { formatStateModel } from './stateModel/format-state-model.js';
