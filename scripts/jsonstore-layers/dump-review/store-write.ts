import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.ts';
import { REPO_ROOT, __dirname } from '../dump-review.js';

export const storeWrite = (...args): string => {
  return execFileSync('node', ['--import', 'tsx', path.join(__dirname, 'jsonstore.ts'), ...args], {
    encoding: 'utf8',
    cwd: REPO_ROOT,
    maxBuffer: 512 * 1024 * 1024,
  }).trim();
};
