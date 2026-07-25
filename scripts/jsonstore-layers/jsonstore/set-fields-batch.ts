import { extractFlag } from './extract-flag.js';
import { readStore } from './read-store.js';
import { upsertRecord } from './upsert-record.js';
import { now } from './now.js';
import { withLock } from './with-lock.js';
import { writeStore } from './write-store.js';

export const setFieldsBatch = (args) => {
  const json = extractFlag(args, '--json');
  if (!json) {
    console.error('set-fields-batch requires --json "{...}"');
    process.exit(1);
  }
  let patch;
  try {
    patch = JSON.parse(json);
  } catch {
    console.error('set-fields-batch --json must be valid JSON.');
    process.exit(1);
  }
  withLock(() => {
    const data = readStore() ?? { meta: { goal: 'jsonstore' }, records: [] };
    let count = 0;
    for (const [id, fields] of Object.entries(patch)) {
      const record = upsertRecord(data, id);
      Object.assign(record, fields);
      record.updatedAt = now();
      count++;
    }
    writeStore(data);
    console.log(`Batch updated ${count} record(s).`);
  });
};
