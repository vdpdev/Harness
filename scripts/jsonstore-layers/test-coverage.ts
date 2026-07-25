import * as fs from 'node:fs';
import * as path from 'node:path';
import * as childProcess from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.ts';
import { analyze } from './test-coverage/analyze.js';
import { claim } from './test-coverage/claim.js';
import { done } from './test-coverage/done.js';
import { init } from './test-coverage/init.js';
import { list } from './test-coverage/list.js';
import { next } from './test-coverage/next.js';
import { release } from './test-coverage/release.js';
import { report } from './test-coverage/report.js';
import { show } from './test-coverage/show.js';
import { stateModel } from './test-coverage/state-model.js';
import { stateTransitions } from './test-coverage/state-transitions.js';
import { status } from './test-coverage/status.js';
import { store } from './test-coverage/store.js';

export const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '..');
export const CATEGORY = 'coverage';
export const IGNORED_DIR_SEGMENTS = new Set(['.tmp', 'node_modules', '.git', 'dist']);
export const noBlockers = { isDone: () => false };
export const TEST_FILE_PATTERNS = [/\.test\.(ts|mts|cts|js|mjs|cjs)$/, /\.spec\.(ts|mts|cts|js|mjs|cjs)$/];
export const SHIELD_PATH_MARKERS = ['repo-hygiene', 'project-health', 'node_modules-guard', 'hygiene', 'lint'];
export const SHIELD_BODY_MARKERS = ['verify:repo-hygiene', 'verify:coverage', 'node_modules'];
const [command, ...rest] = process.argv.slice(2);
const commands = {
  init,
  list,
  next,
  claim,
  done,
  release,
  show,
  status,
  analyze,
  report,
  stateTransitions,
  stateModel,
};
if (!command || !commands[command]) {
  console.log(`test-coverage.ts — Sword-vs-Shield test-coverage harness

Commands:
  init [--root <dir>] [--reset]        Discover + classify every test file into jsonstore
  list [--status ...] [--classification sword|shield] [--project <name>] [--first N] [--last N]
  next [--project <name>]              Claim & print the next pending test file
  claim <id>                           Mark a test file inProgress
  done <id> [--notes "..."] [--findings "..."] [--ticketed "PREFIX-1,PREFIX-2"]
  release <id>                         Return a test file to pending
  show <id>                            Print a test entry
  status                               Progress + ticket-yield summary
  analyze <id> [--rerun N]             Execute + score sword/shield strength
  report                               Coverage report: sword/shield balance + strength + weaknesses
  stateTransitions <id>                Print current state + allowed next states (FSM)
  stateModel                           Print the full ticket + coverage state graph`);
  process.exit(command ? 1 : 0);
}
commands[command](rest);

// Extracted functions (single-responsibility modules)
export { store };
export { readStore } from './test-coverage/read-store.js';
export { writeStore } from './test-coverage/write-store.js';
export { now } from './test-coverage/now.js';
export { isTestFile } from './test-coverage/is-test-file.js';
export { classifyFile } from './test-coverage/classify-file.js';
export { walk } from './test-coverage/walk.js';
export { idFor } from './test-coverage/id-for.js';
export { projectFor } from './test-coverage/project-for.js';
export { init };
export { requireStore } from './test-coverage/require-store.js';
export { readAll } from './test-coverage/read-all.js';
export { list };
export { next };
export { claim };
export { done };
export { release };
export { show };
export { status };
export { report };
export { execTestOnce } from './test-coverage/exec-test-once.js';
export { parseSummary } from './test-coverage/parse-summary.js';
export { analyzeFile } from './test-coverage/analyze-file.js';
export { analyze };
export { stateTransitions };
export { stateModel };
export { printEntry } from './test-coverage/print-entry.js';
export { extractFlag } from './test-coverage/extract-flag.js';
export { extractNumFlag } from './test-coverage/extract-num-flag.js';
