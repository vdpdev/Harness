import * as fs from 'node:fs';
import * as path from 'node:path';
import * as childProcess from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.ts';
import { extractFlag } from './extract-flag.js';
import { requireStore } from './require-store.js';
import { status } from './status.js';
import { now } from './now.js';
import { writeStore } from './write-store.js';
import { printEntry } from './print-entry.js';

export const next = (args) => {
  const projectFilter = extractFlag(args, '--project');
  const data = requireStore();
  const candidates = (data.entries ?? []).filter(
    (e) => e.status === 'pending' && (!projectFilter || e.project === projectFilter),
  );

  if (!candidates.length) {
    const inProgress = (data.entries ?? []).filter(
      (e) => e.status === 'inProgress' && (!projectFilter || e.project === projectFilter),
    );
    if (inProgress.length) {
      console.log(`No pending test files. ${inProgress.length} still inProgress (resume these):`);
      for (const e of inProgress) console.log(`  ${e.id}`);
      return;
    }
    console.log(
      projectFilter ? `No pending test files for project "${projectFilter}".` : 'No pending test files. Duel complete.',
    );
    return;
  }

  const entry = candidates[0];
  entry.status = 'inProgress';
  entry.updatedAt = now();
  writeStore(data);
  printEntry(entry);
};
