import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractFlag } from './extract-flag.js';
import { readStore } from './read-store.js';
import { withLock } from './with-lock.js';
import { writeStore } from './write-store.js';
import { now } from './now.js';

export const reset = (args) => {
  const category = extractFlag(args, '--category');
  const data = readStore();
  if (!data) {
    console.log('Store does not exist; nothing to reset.');
    return;
  }
  if (category) {
    data.records = (data.records ?? []).filter((r) => r.category !== category);
    withLock(() => writeStore(data));
    console.log(`Reset category "${category}". ${data.records.length} record(s) remain.`);
  } else {
    withLock(() => writeStore({ meta: { goal: 'wiped', resetAt: now() }, records: [] }));
    console.log('Store wiped (all categories).');
  }
};
