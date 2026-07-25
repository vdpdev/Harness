import { defaultChecks } from './scripts/repo-health/defaults.js';
import type { HealthCheckEntry } from './scripts/repo-health/types.js';

export const checks: HealthCheckEntry[] = [
  ...defaultChecks,
  // Add custom checks here. Each entry has name, description, and run function.
  // Example:
  // {
  //   name: 'my-custom-check',
  //   description: 'What this check verifies',
  //   run: async () => ({ name: 'my-custom-check', ok: true, detail: 'All good' }),
  // },
];
