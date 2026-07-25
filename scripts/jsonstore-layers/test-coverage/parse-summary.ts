import * as fs from 'node:fs';
import * as path from 'node:path';
import * as childProcess from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.ts';

export const parseSummary = (stdout) => {
  const out = stdout || '';
  const num = (label) => {
    const m = out.match(new RegExp(`#\\s*${label}\\s+(\\d+)`));
    return m ? Number(m[1]) : 0;
  };
  const failures = [...out.matchAll(/not ok\s+\d+\s+-\s+([^\n]+)/g)].map((m) => m[1].trim());
  return {
    tests: num('tests'),
    pass: num('pass'),
    fail: num('fail'),
    suites: num('suites'),
    failures,
  };
};
