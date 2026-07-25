import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { del } from './jsonstore/del.js';
import { get } from './jsonstore/get.js';
import { init } from './jsonstore/init.js';
import { list } from './jsonstore/list.js';
import { reset } from './jsonstore/reset.js';
import { set } from './jsonstore/set.js';
import { setField } from './jsonstore/set-field.js';
import { setFields } from './jsonstore/set-fields.js';
import { setFieldsBatch } from './jsonstore/set-fields-batch.js';
import { status } from './jsonstore/status.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '..');
export const STORE_PATH = process.env.SW_JSONSTORE_PATH
  ? path.resolve(process.env.SW_JSONSTORE_PATH)
  : path.join(REPO_ROOT, '.tmp', 'temp.json');
export const IGNORED_DIR_SEGMENTS = new Set(['.tmp', 'node_modules', '.git', 'dist']);
export const DEFAULT_GLOB = '**/*.test.ts';
export const LOCK_PATH = `${STORE_PATH}.lock`;
export const LOCK_TIMEOUT_MS = 30000;
export const LOCK_RETRY_MS = 25;
const [command, ...rest] = process.argv.slice(2);
const commands = {
  init,
  get,
  list,
  set,
  'set-field': setField,
  'set-fields': setFields,
  'set-fields-batch': setFieldsBatch,
  delete: del,
  reset,
  status,
};
if (!command || !commands[command]) {
  console.log(`jsonstore.ts — generic JSON-backed CRUD store (JSON-Redis)

Commands:
  init [--category <name>] [--root <dir>] [--glob "**/*.test.ts"] [--reset]   Enqueue files as records
  get <id>                       Print one record (full JSON)
  list [--category <name>] [--first N] [--last N]
  set <id> --value "..."        Set the record's value field
  set-field <id> --field <n> --value "..."   Set one arbitrary field
  set-fields <id> --json '{...}'            Merge a JSON patch of fields
  set-fields-batch --json '{id: patch}'   Merge patches into multiple records atomically
  delete <id>                    Remove a record
  reset [--category <name>]      Wipe store (or one category)
  status [--category <name>]     Count records by status

This module owns NO FSM. Layers (runartifacts/test-coverage/dogfood) enforce their own.
Store: .tmp/temp.json (gitignored; wipe with init --reset).`);
  process.exit(command ? 1 : 0);
}
commands[command](rest);

// Extracted functions (single-responsibility modules)
export { readStore } from './jsonstore/read-store.js';
export { writeStore } from './jsonstore/write-store.js';
export { acquireLock } from './jsonstore/acquire-lock.js';
export { releaseLock } from './jsonstore/release-lock.js';
export { pidAlive } from './jsonstore/pid-alive.js';
export { withLock } from './jsonstore/with-lock.js';
export { now } from './jsonstore/now.js';
export { globToSuffix } from './jsonstore/glob-to-suffix.js';
export { walk } from './jsonstore/walk.js';
export { idFor } from './jsonstore/id-for.js';
export { requireStore } from './jsonstore/require-store.js';
export { findByOrDie } from './jsonstore/find-by-or-die.js';
export { upsertRecord } from './jsonstore/upsert-record.js';
export { filterByCategory } from './jsonstore/filter-by-category.js';
export { init };
export { get };
export { list };
export { set };
export { setField };
export { setFields };
export { del };
export { reset };
export { status };
export { extractFlag } from './jsonstore/extract-flag.js';
export { extractNumFlag } from './jsonstore/extract-num-flag.js';
