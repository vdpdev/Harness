import type { HealthCheckEntry } from './types.js';
import { runCheck } from './run-check.js';
import { runSplitValidate } from './run-split-validate.js';

export const defaultChecks: HealthCheckEntry[] = [
  {
    name: 'coverage',
    description: 'Package scripts / source tree / test coverage / format / lint / repo hygiene',
    run: () => runCheck('coverage', []),
  },
  {
    name: 'structure',
    description: 'Repo structure invariants (scripts, tsconfig, gitignore, tickets)',
    run: () => runCheck('structure', []),
  },
  {
    name: 'test-health',
    description: 'Test file + export symbol coverage',
    run: () => runCheck('test-health', []),
  },
  {
    name: 'split-validate',
    description: 'Split-functions validation (files needing split)',
    run: runSplitValidate,
  },
  {
    name: 'skill-registry',
    description: 'AGENTS.md skill registry matches .agents/skills/ directory',
    run: () => runCheck('skill-registry', []),
  },
];
