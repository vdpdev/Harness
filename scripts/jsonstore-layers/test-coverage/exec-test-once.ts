import * as fs from 'node:fs';
import * as path from 'node:path';
import * as childProcess from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.ts';
import { REPO_ROOT } from '../test-coverage.js';
import { status } from './status.js';

export const execTestOnce = (absPath) => {
  try {
    const result = childProcess.execFileSync('node', ['--import', 'tsx', '--test', absPath], {
      encoding: 'utf8',
      cwd: REPO_ROOT,
      timeout: 120000,
    });
    return { code: 0, stdout: result, stderr: '' };
  } catch (err) {
    return {
      code: err.status ?? 1,
      stdout: err.stdout ?? '',
      stderr: err.stderr ?? '',
    };
  }
};
