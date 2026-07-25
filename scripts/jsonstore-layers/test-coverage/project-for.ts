import * as fs from 'node:fs';
import * as path from 'node:path';
import * as childProcess from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.ts';

export const projectFor = (relPath) => {
  const parts = relPath.split(path.sep);
  return parts[0] ?? 'unknown';
};
