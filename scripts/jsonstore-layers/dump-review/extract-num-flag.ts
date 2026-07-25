import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.ts';
import { extractFlag } from './extract-flag.js';

export const extractNumFlag = (args, flag) => {
  const raw = extractFlag(args, flag);
  if (raw === undefined) return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) {
    console.error(`Flag ${flag} requires a non-negative number.`);
    process.exit(1);
  }
  return n;
};
