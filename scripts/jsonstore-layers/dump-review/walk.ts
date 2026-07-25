import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.ts';
import { IGNORED_DIR_SEGMENTS } from '../dump-review.js';
import { isDumpFile } from './is-dump-file.js';

export const walk = (dir, insidePreviewOutput, acc) => {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (IGNORED_DIR_SEGMENTS.has(entry.name)) continue;
      const nowInside = insidePreviewOutput || entry.name === 'preview-output';
      walk(path.join(dir, entry.name), nowInside, acc);
    } else if (entry.isFile() && insidePreviewOutput && isDumpFile(entry.name)) {
      acc.push(path.join(dir, entry.name));
    }
  }
  return acc;
};
