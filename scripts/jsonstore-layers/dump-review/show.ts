import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.ts';
import { requireRecord } from './require-record.js';
import { readAll } from './read-all.js';
import { printEntry } from './print-entry.js';

export const show = (args) => {
  const id = args[0];
  if (!id) {
    console.error('Usage: dump-review.ts show <id>');
    process.exit(1);
  }
  const entry = requireRecord(readAll(), id);
  printEntry(entry);
};
