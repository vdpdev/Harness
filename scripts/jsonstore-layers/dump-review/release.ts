import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.ts';
import { readAll } from './read-all.js';
import { requireRecord } from './require-record.js';
import { writeRecord } from './write-record.js';
import { status } from './status.js';

export const release = (args) => {
  const id = args[0];
  if (!id) {
    console.error('Usage: dump-review.ts release <id>');
    process.exit(1);
  }
  const entries = readAll();
  requireRecord(entries, id);
  writeRecord(id, { status: 'pending', verdict: null, updatedAt: new Date().toISOString() });
  console.log(`Released ${id} (now pending)`);
};
