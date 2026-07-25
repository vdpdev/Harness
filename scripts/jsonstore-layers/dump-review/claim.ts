import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.ts';
import { noBlockers } from '../dump-review.js';
import { readAll } from './read-all.js';
import { requireRecord } from './require-record.js';
import { status } from './status.js';
import { writeRecord } from './write-record.js';

export const claim = (args) => {
  const id = args[0];
  if (!id) {
    console.error('Usage: dump-review.ts claim <id>');
    process.exit(1);
  }
  const entries = readAll();
  const entry = requireRecord(entries, id);
  if (entry.status === 'reviewed') {
    console.error(`Dump entry ${id} is already reviewed.`);
    process.exit(1);
  }
  const { allowed, reason } = canTransition('runartifacts', entry.status, 'claim', entry, noBlockers);
  if (!allowed) {
    console.error(`Cannot claim ${id}: ${reason}.`);
    process.exit(1);
  }
  const prev = entry.status;
  writeRecord(id, { status: 'inProgress', updatedAt: new Date().toISOString() });
  console.log(`Claimed ${id} (was ${prev}, now inProgress)`);
};
