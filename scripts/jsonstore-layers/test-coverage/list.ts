import * as fs from 'node:fs';
import * as path from 'node:path';
import * as childProcess from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.ts';
import { extractFlag } from './extract-flag.js';
import { extractNumFlag } from './extract-num-flag.js';
import { requireStore } from './require-store.js';
import { status } from './status.js';

export const list = (args) => {
  const statusFilter = extractFlag(args, '--status');
  const classificationFilter = extractFlag(args, '--classification');
  const projectFilter = extractFlag(args, '--project');
  const firstN = extractNumFlag(args, '--first');
  const lastN = extractNumFlag(args, '--last');

  const data = requireStore();
  let entries = data.entries ?? [];
  if (statusFilter) entries = entries.filter((e) => e.status === statusFilter);
  if (classificationFilter) entries = entries.filter((e) => e.classification === classificationFilter);
  if (projectFilter) entries = entries.filter((e) => e.project === projectFilter);

  if (!entries.length) {
    console.log('No matching test entries.');
    return;
  }

  if (firstN !== undefined) entries = entries.slice(0, firstN);
  else if (lastN !== undefined) entries = entries.slice(-lastN);

  for (const e of entries) {
    const status = e.status === 'pending' ? '' : ` (${e.status})`;
    const verdict = e.verdict ? ` [${e.verdict}]` : '';
    const tix = e.ticketed?.length ? ` -> ${e.ticketed.join(', ')}` : '';
    console.log(`  ${e.id}${status} (${e.classification})${verdict}${tix}`);
  }
  console.log(`\n${entries.length} test file(s)`);
};
