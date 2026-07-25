import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireStore } from './require-store.js';
import { withLock } from './with-lock.js';
import { writeStore } from './write-store.js';

export const del = (args) => {
  const id = args[0];
  if (!id) {
    console.error('Usage: jsonstore.ts delete <id>');
    process.exit(1);
  }
  const data = requireStore();
  const before = data.records.length;
  data.records = data.records.filter((r) => r.id !== id);
  if (data.records.length === before) {
    console.error(`Record ${id} not found.`);
    process.exit(1);
  }
  withLock(() => writeStore(data));
  console.log(`Deleted ${id}.`);
};
