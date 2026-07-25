import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.ts';
import { noBlockers } from '../dump-review.js';
import { requireRecord } from './require-record.js';
import { readAll } from './read-all.js';
import { status } from './status.js';

export const stateTransitions = (args) => {
  const id = args[0];
  if (!id) {
    console.error('Usage: dump-review.ts stateTransitions <id>');
    process.exit(1);
  }
  const entry = requireRecord(readAll(), id);
  console.log(formatStateTransitions('runartifacts', entry.status, entry, noBlockers));
};
