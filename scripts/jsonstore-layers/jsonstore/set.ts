import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractFlag } from './extract-flag.js';
import { readStore } from './read-store.js';
import { upsertRecord } from './upsert-record.js';
import { now } from './now.js';
import { withLock } from './with-lock.js';
import { writeStore } from './write-store.js';

export const set = (args) => {
  const id = args[0];
  if (!id) {
    console.error('Usage: jsonstore.ts set <id> --value "..."');
    process.exit(1);
  }
  const value = extractFlag(args, '--value');
  if (value === undefined) {
    console.error('set requires --value "..."');
    process.exit(1);
  }
  const data = readStore() ?? { meta: { goal: 'jsonstore' }, records: [] };
  const record = upsertRecord(data, id);
  record.value = value;
  record.updatedAt = now();
  withLock(() => writeStore(data));
  console.log(`Set value for ${id} (${value.length} chars).`);
};
