import { execFileSync } from 'node:child_process';
import { cwd } from 'node:process';
import type { HealthCheckResult } from './types.js';

const CHECK_FILES: Record<string, string> = {
  coverage: 'verify-coverage.ts',
  structure: 'verify-repo-structure.ts',
  'test-health': 'check-test-health.ts',
  'skill-registry': 'verify-skill-registry.ts',
};

export const runCheck = (name: string, extraArgs: string[]): HealthCheckResult => {
  const script = CHECK_FILES[name];
  if (!script) {
    return { name, ok: false, detail: `Unknown check: ${name}` };
  }
  const scriptPath = `scripts/utils/${script}`;
  try {
    const output = execFileSync('node', ['--import', 'tsx', scriptPath, ...extraArgs], {
      cwd: cwd(),
      encoding: 'utf8',
      timeout: 120_000,
    });
    return { name, ok: true, detail: output.trim() };
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; message?: string };
    return { name, ok: false, detail: (e.stdout || e.stderr || e.message || '').trim() };
  }
};
