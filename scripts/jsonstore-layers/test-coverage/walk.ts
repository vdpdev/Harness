import * as fs from 'node:fs';
import * as path from 'node:path';
import * as childProcess from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.ts';
import { IGNORED_DIR_SEGMENTS } from '../test-coverage.js';
import { isTestFile } from './is-test-file.js';

export const walk = (dir, acc) => {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (IGNORED_DIR_SEGMENTS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), acc);
    } else if (entry.isFile() && isTestFile(entry.name)) {
      acc.push(path.join(dir, entry.name));
    }
  }
  return acc;
};
