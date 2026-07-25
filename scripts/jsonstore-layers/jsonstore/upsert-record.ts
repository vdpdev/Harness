import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { now } from './now.js';

export const upsertRecord = (data, id, category = 'scratch') => {
  let record = (data.records ?? []).find((r) => r.id === id);
  if (!record) {
    record = { id, category, createdAt: now(), updatedAt: now() };
    data.records = data.records ?? [];
    data.records.push(record);
  }
  return record;
};
