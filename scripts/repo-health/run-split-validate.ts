import { execFileSync } from 'node:child_process';
import { cwd } from 'node:process';
import type { HealthCheckResult } from './types.js';

export const runSplitValidate = (): HealthCheckResult => {
  try {
    const output = execFileSync('node', ['--import', 'tsx', 'scripts/utils/split-functions.ts', '--validate'], {
      cwd: cwd(),
      encoding: 'utf8',
      timeout: 60_000,
    });
    return { name: 'split-validate', ok: true, detail: output.trim() };
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; message?: string };
    return { name: 'split-validate', ok: false, detail: (e.stdout || e.stderr || e.message || '').trim() };
  }
};
