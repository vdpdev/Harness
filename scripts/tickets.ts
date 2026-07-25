import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canTransition, formatStateModel, formatStateTransitions } from './utils/stateModel.js';
import { TICKET_ID_FORMAT } from './tickets/config.js';
import { add } from './tickets/add.js';
import { blocked } from './tickets/blocked.js';
import { children } from './tickets/children.js';
import { claim } from './tickets/claim.js';
import { done } from './tickets/done.js';
import { list } from './tickets/list.js';
import { release } from './tickets/release.js';
import { show } from './tickets/show.js';
import { stateModel } from './tickets/state-model.js';
import { stateTransitions } from './tickets/state-transitions.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
export const TICKETS_PATH = process.env.SW_TICKETS_PATH
  ? path.resolve(process.env.SW_TICKETS_PATH)
  : path.join(REPO_ROOT, 'tickets.json');
export const LOCK_PATH = `${TICKETS_PATH}.lock`;
export const LOCK_TIMEOUT_MS = 30000;
export const LOCK_RETRY_MS = 25;
const [command, ...rest] = process.argv.slice(2);
const commands = { add, list, claim, done, release, show, blocked, children, stateTransitions, stateModel };
if (!command || !commands[command]) {
  console.log(`tickets.ts — ticket store CLI

Commands:
  add <id> <title> [--notes "..."] [--blocked-by "${TICKET_ID_FORMAT},${TICKET_ID_FORMAT}"] [--parent "${TICKET_ID_FORMAT}"]
  list [--status open|inProgress] [--first N] [--last N] [--sort asc|desc]
  claim <id>
  done <id> [--notes "..."]
  release <id>
  show <id>
  blocked
  children <parent-id>        List all child tickets of a parent
  stateTransitions <id>       Print current state + allowed next states (FSM)
  stateModel                  Print the full ticket + coverage state graph`);
  process.exit(command ? 1 : 0);
}
commands[command](rest);

// Extracted functions (single-responsibility modules)
export { isTicketDone } from './tickets/is-ticket-done.js';
export { readJson } from './tickets/read-json.js';
export { writeJson } from './tickets/write-json.js';
export { pidAlive } from './tickets/pid-alive.js';
export { acquireLock } from './tickets/acquire-lock.js';
export { releaseLock } from './tickets/release-lock.js';
export { withLock } from './tickets/with-lock.js';
export { now } from './tickets/now.js';
export { add };
export { list };
export { claim };
export { done };
export { release };
export { show };
export { blocked };
export { children };
export { stateTransitions };
export { stateModel };
export { extractFlag } from './tickets/extract-flag.js';
export { extractNumFlag } from './tickets/extract-num-flag.js';
