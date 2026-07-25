import { pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { HealthCheckEntry, HealthCheckResult } from './types.js';
import { defaultChecks } from './defaults.js';
import { printSummary } from './print-summary.js';

const QUICK_NAMES = ['coverage', 'structure'];

export const aggregator = async (): Promise<void> => {
  const args = process.argv.slice(2);
  const CI = args.includes('ci');
  const STRICT = args.includes('--strict');

  const checks = await loadChecks();

  const allNames = checks.map((c) => c.name);
  const explicitNames = args.filter((a) => allNames.includes(a));

  let selected: HealthCheckEntry[];
  if (explicitNames.length > 0) {
    selected = checks.filter((c) => explicitNames.includes(c.name));
  } else if (args.includes('quick')) {
    selected = checks.filter((c) => QUICK_NAMES.includes(c.name));
  } else {
    selected = checks;
  }

  const results: HealthCheckResult[] = [];

  for (const entry of selected) {
    console.log(`\n=== ${entry.description} ===`);
    results.push(await runCheck(entry));
  }

  printSummary(results);

  const anyFailed = results.some((r) => !r.ok);
  if (anyFailed) {
    const testHealthFailed = results.some((r) => r.name === 'test-health' && !r.ok);
    if (testHealthFailed && !STRICT) {
      console.log('Note: test-health failures are warnings. Use --strict to make them block CI.');
    } else {
      process.exit(1);
    }
  }
};

const loadChecks = async (): Promise<HealthCheckEntry[]> => {
  const userFile = resolve('repo-health.checks.ts');
  if (existsSync(userFile)) {
    const mod = await import(pathToFileURL(userFile).href);
    if (Array.isArray(mod.checks)) {
      return mod.checks as HealthCheckEntry[];
    }
    console.warn(`Warning: ${userFile} does not export a "checks" array. Using defaults.`);
  }
  return [...defaultChecks];
};

const runCheck = async (entry: HealthCheckEntry): Promise<HealthCheckResult> => {
  try {
    return await entry.run();
  } catch (err: unknown) {
    const e = err as { message?: string };
    return { name: entry.name, ok: false, detail: e.message ?? String(err) };
  }
};
