import * as fs from 'node:fs';
import * as path from 'node:path';
import * as childProcess from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.ts';
import { REPO_ROOT, SHIELD_BODY_MARKERS, SHIELD_PATH_MARKERS } from '../test-coverage.js';

export const classifyFile = (relPath) => {
  const lower = relPath.toLowerCase();
  if (lower.includes('examples/')) return 'sword';
  if (SHIELD_PATH_MARKERS.some((m) => lower.includes(m))) return 'shield';
  try {
    const abs = path.resolve(REPO_ROOT, relPath);
    const head = fs.readFileSync(abs, 'utf8').slice(0, 4096);
    if (SHIELD_BODY_MARKERS.some((m) => head.includes(m))) return 'shield';
  } catch {
    /* unreadable → fall through to keyword default */
  }
  return 'sword';
};
