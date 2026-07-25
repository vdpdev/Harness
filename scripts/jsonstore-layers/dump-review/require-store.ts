import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.ts';
import { readAll } from './read-all.js';

export const requireStore = () => {
  const entries = readAll();
  if (!entries.length) {
    console.error('Dump review store empty. Run: node scripts/dump-review.ts init');
    process.exit(1);
  }
  return entries;
};
