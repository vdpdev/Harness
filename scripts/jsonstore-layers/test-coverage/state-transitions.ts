import * as fs from 'node:fs';
import * as path from 'node:path';
import * as childProcess from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.ts';
import { noBlockers } from '../test-coverage.js';
import { requireStore } from './require-store.js';
import { status } from './status.js';

export const stateTransitions = (args) => {
  const id = args[0];
  if (!id) {
    console.error('Usage: test-coverage.ts stateTransitions <id>');
    process.exit(1);
  }
  const data = requireStore();
  const entry = data.entries.find((e) => e.id === id);
  if (!entry) {
    console.error(`Test entry ${id} not found.`);
    process.exit(1);
  }
  console.log(formatStateTransitions('coverage', entry.status, entry, noBlockers));
};
