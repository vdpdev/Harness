import * as fs from 'node:fs';
import * as path from 'node:path';
import * as childProcess from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.ts';
import { noBlockers } from '../test-coverage.js';
import { requireStore } from './require-store.js';
import { status } from './status.js';
import { now } from './now.js';
import { writeStore } from './write-store.js';

export const claim = (args) => {
  const id = args[0];
  if (!id) {
    console.error('Usage: test-coverage.ts claim <id>');
    process.exit(1);
  }
  const data = requireStore();
  const entry = data.entries.find((e) => e.id === id);
  if (!entry) {
    console.error(`Test entry ${id} not found.`);
    process.exit(1);
  }
  if (entry.status === 'reviewed') {
    console.error(`Test entry ${id} is already reviewed.`);
    process.exit(1);
  }
  const { allowed, reason } = canTransition('coverage', entry.status, 'claim', entry, noBlockers);
  if (!allowed) {
    console.error(`Cannot claim ${id}: ${reason}.`);
    process.exit(1);
  }
  const prev = entry.status;
  entry.status = 'inProgress';
  entry.updatedAt = now();
  writeStore(data);
  console.log(`Claimed ${id} (was ${prev}, now inProgress)`);
};
