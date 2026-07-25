import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractFlag } from './extract-flag.js';
import { readStore } from './read-store.js';
import { upsertRecord } from './upsert-record.js';
import { now } from './now.js';
import { withLock } from './with-lock.js';
import { writeStore } from './write-store.js';

export const setFields = (args) => {
  const id = args[0];
  if (!id) {
    console.error('Usage: jsonstore.ts set-fields <id> --json \'{ "a": 1 }\'');
    process.exit(1);
  }
  const json = extractFlag(args, '--json');
  if (!json) {
    console.error('set-fields requires --json "{...}"');
    process.exit(1);
  }
  let patch;
  try {
    patch = JSON.parse(json);
  } catch {
    console.error('set-fields --json must be valid JSON.');
    process.exit(1);
  }
  const data = readStore() ?? { meta: { goal: 'jsonstore' }, records: [] };
  const record = upsertRecord(data, id);
  Object.assign(record, patch);
  record.updatedAt = now();
  withLock(() => writeStore(data));
  console.log(`Merged ${Object.keys(patch).length} field(s) into ${id}.`);
};
