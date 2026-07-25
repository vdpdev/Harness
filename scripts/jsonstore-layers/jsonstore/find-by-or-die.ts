import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

export const findByOrDie = (data, id) => {
  const record = (data.records ?? []).find((r) => r.id === id);
  if (!record) {
    console.error(`Record ${id} not found.`);
    process.exit(1);
  }
  return record;
};
