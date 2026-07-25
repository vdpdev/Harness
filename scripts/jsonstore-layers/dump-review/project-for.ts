import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.ts';

export const projectFor = (relPath) => {
  const parts = relPath.split(path.sep);
  const idx = parts.indexOf('preview-output');
  if (idx > 0) return parts[idx - 1];
  return parts[0] ?? 'unknown';
};
