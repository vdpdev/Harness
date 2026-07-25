import * as fs from 'node:fs';
import * as path from 'node:path';
import * as childProcess from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.ts';
import { REPO_ROOT, __dirname } from '../test-coverage.js';

export const store = (...args) =>
  childProcess
    .execFileSync('node', ['--import', 'tsx', path.join(__dirname, 'jsonstore.ts'), ...args], {
      encoding: 'utf8',
      cwd: REPO_ROOT,
      maxBuffer: 512 * 1024 * 1024,
    })
    .trim();
