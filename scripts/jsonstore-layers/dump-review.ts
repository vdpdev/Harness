import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.ts';
import { claim } from './dump-review/claim.js';
import { done } from './dump-review/done.js';
import { init } from './dump-review/init.js';
import { list } from './dump-review/list.js';
import { next } from './dump-review/next.js';
import { release } from './dump-review/release.js';
import { show } from './dump-review/show.js';
import { stateModel } from './dump-review/state-model.js';
import { stateTransitions } from './dump-review/state-transitions.js';
import { status } from './dump-review/status.js';

export const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '..');
export const CATEGORY = 'runartifacts';
export const noBlockers = { isDone: () => false };
export const IGNORED_DIR_SEGMENTS = new Set(['.tmp', 'node_modules', '.git', 'dist']);
const [command, ...rest] = process.argv.slice(2);
const commands = { init, list, next, claim, done, release, show, status, stateTransitions, stateModel };
if (!command || !commands[command]) {
  console.log(`dump-review.ts — resumable review-coverage harness (feeds ticket creation; NOT a ticket store)

Thin layer over jsonstore.ts (category "runartifacts"). Persists all records in .tmp/temp.json.
Commands:
  init [--root <dir>] [--reset]        Phase 1: scan preview-output dumps into jsonstore
  list [--status ...] [--verdict clean|ticketed] [--project <name>] [--first N] [--last N]
  next [--project <name>]              Phase 2: claim & print the next pending dump
  claim <id>                           Mark a dump inProgress
  done <id> [--notes "..."] [--tickets "PREFIX-1,PREFIX-2"]   Mark reviewed (verdict inferred from --tickets)
  release <id>                         Return a dump to pending
  show <id>                            Print a dump entry
  status                               Progress + ticket-yield summary
  stateTransitions <id>                Print current state + allowed next states (FSM)
  stateModel                          Print the full ticket + runartifacts state graph`);
  process.exit(command ? 1 : 0);
}
commands[command](rest);

// Extracted functions (single-responsibility modules)
export { storeRead } from './dump-review/store-read.js';
export { storeWrite } from './dump-review/store-write.js';
export { readAll } from './dump-review/read-all.js';
export { writeRecord } from './dump-review/write-record.js';
export { requireStore } from './dump-review/require-store.js';
export { requireRecord } from './dump-review/require-record.js';
export { isDumpFile } from './dump-review/is-dump-file.js';
export { walk } from './dump-review/walk.js';
export { projectFor } from './dump-review/project-for.js';
export { idFor } from './dump-review/id-for.js';
export { init };
export { list };
export { next };
export { claim };
export { done };
export { release };
export { show };
export { status };
export { stateTransitions };
export { stateModel };
export { printEntry } from './dump-review/print-entry.js';
export { extractFlag } from './dump-review/extract-flag.js';
export { extractNumFlag } from './dump-review/extract-num-flag.js';
