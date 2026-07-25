import * as fs from 'node:fs';
import * as path from 'node:path';
import * as childProcess from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.ts';
import { readStore } from './read-store.js';

export const requireStore = () => {
  let data;
  try {
    data = readStore();
  } catch {
    data = null;
  }
  if (!data || !data.entries || data.entries.length === 0) {
    console.error('coverage store empty. Run: node scripts/test-coverage.ts init');
    process.exit(1);
  }
  return data;
};
