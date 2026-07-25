export type { HealthCheck, HealthCheckEntry, HealthCheckResult } from './repo-health/types.js';
export { defaultChecks } from './repo-health/defaults.js';
export { aggregator } from './repo-health/aggregator.js';
export { printSummary } from './repo-health/print-summary.js';
export { runCheck } from './repo-health/run-check.js';
export { runSplitValidate } from './repo-health/run-split-validate.js';

import { aggregator } from './repo-health/aggregator.js';

aggregator();
