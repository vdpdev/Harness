import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.ts';
import { noBlockers } from '../dump-review.js';
import { extractFlag } from './extract-flag.js';
import { readAll } from './read-all.js';
import { status } from './status.js';
import { writeRecord } from './write-record.js';
import { printEntry } from './print-entry.js';

export const next = (args) => {
  const projectFilter = extractFlag(args, '--project');
  let entries = readAll();
  const candidates = entries.filter((e) => e.status === 'pending' && (!projectFilter || e.project === projectFilter));

  if (!candidates.length) {
    const inProgress = entries.filter(
      (e) => e.status === 'inProgress' && (!projectFilter || e.project === projectFilter),
    );
    if (inProgress.length) {
      console.log(`No pending dumps. ${inProgress.length} still inProgress (resume these):`);
      for (const e of inProgress) console.log(`  ${e.id}`);
      return;
    }
    console.log(
      projectFilter ? `No pending dumps for project "${projectFilter}".` : 'No pending dumps. Review complete.',
    );
    return;
  }

  const entry = candidates[0];
  // Route through the FSM guard for consistency with claim().
  const { allowed, reason } = canTransition('runartifacts', entry.status, 'claim', entry, noBlockers);
  if (!allowed) {
    console.error(`Cannot advance ${entry.id}: ${reason}.`);
    process.exit(1);
  }
  entry.status = 'inProgress';
  entry.updatedAt = new Date().toISOString();
  writeRecord(entry.id, { status: entry.status, updatedAt: entry.updatedAt });
  printEntry(entry);
};
