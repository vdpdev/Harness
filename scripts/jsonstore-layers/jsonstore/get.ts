import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireStore } from './require-store.js';
import { findByOrDie } from './find-by-or-die.js';

export const get = (args) => {
  const id = args[0];
  if (!id) {
    console.error('Usage: jsonstore.ts get <id>');
    process.exit(1);
  }
  const data = requireStore();
  const record = findByOrDie(data, id);
  console.log(JSON.stringify(record, null, 2));
};
