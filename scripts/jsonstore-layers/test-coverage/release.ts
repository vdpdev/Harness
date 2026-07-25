import * as fs from 'node:fs';
import * as path from 'node:path';
import * as childProcess from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.ts';
import { requireStore } from './require-store.js';
import { status } from './status.js';
import { now } from './now.js';
import { writeStore } from './write-store.js';

export const release = (args) => {
  const id = args[0];
  if (!id) {
    console.error('Usage: test-coverage.ts release <id>');
    process.exit(1);
  }
  const data = requireStore();
  const entry = data.entries.find((e) => e.id === id);
  if (!entry) {
    console.error(`Test entry ${id} not found.`);
    process.exit(1);
  }
  entry.status = 'pending';
  entry.verdict = null;
  entry.updatedAt = now();
  writeStore(data);
  console.log(`Released ${id} (now pending)`);
};
