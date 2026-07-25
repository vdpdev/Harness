import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractFlag } from './extract-flag.js';
import { extractNumFlag } from './extract-num-flag.js';
import { readStore } from './read-store.js';
import { filterByCategory } from './filter-by-category.js';

export const list = (args) => {
  const category = extractFlag(args, '--category');
  const firstN = extractNumFlag(args, '--first');
  const lastN = extractNumFlag(args, '--last');

  // `list` is a read: tolerate a missing/empty store (returns []) so callers
  // built on top of jsonstore can safely read before any write has happened.
  const data = readStore() ?? { records: [] };
  let records = filterByCategory(data.records ?? [], category);

  if (!records.length) {
    if (args.includes('--json')) console.log('[]');
    else console.log('No matching records.');
    return;
  }

  if (firstN !== undefined) records = records.slice(0, firstN);
  else if (lastN !== undefined) records = records.slice(-lastN);

  if (args.includes('--json')) {
    console.log(JSON.stringify(records));
    return;
  }

  for (const r of records) {
    const cat = r.category ? ` (${r.category})` : '';
    const hasVal = r.value
      ? ` — ${(r.value.length > 60 ? r.value.slice(0, 60) + '…' : r.value).replace(/\n/g, ' ')}`
      : '';
    console.log(`  ${r.id}${cat}${hasVal}`);
  }
  console.log(`\n${records.length} record(s)`);
};
