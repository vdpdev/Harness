import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractFlag } from './extract-flag.js';
import { requireStore } from './require-store.js';
import { filterByCategory } from './filter-by-category.js';

export const status = (args) => {
  const category = extractFlag(args, '--category');
  const data = requireStore();
  const records = filterByCategory(data.records ?? [], category);
  const counts = {};
  for (const r of records) {
    const key = r.status ?? '(no status)';
    counts[key] = (counts[key] ?? 0) + 1;
  }
  const total = records.length;
  console.log(`JSON-Redis: ${total} record(s)${category ? ` (category "${category}")` : ''}`);
  for (const [k, v] of Object.entries(counts)) {
    console.log(`  ${k}: ${v}`);
  }
};
