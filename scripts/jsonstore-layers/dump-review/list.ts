import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.ts';
import { extractFlag } from './extract-flag.js';
import { extractNumFlag } from './extract-num-flag.js';
import { readAll } from './read-all.js';
import { status } from './status.js';

export const list = (args) => {
  const statusFilter = extractFlag(args, '--status');
  const verdictFilter = extractFlag(args, '--verdict');
  const projectFilter = extractFlag(args, '--project');
  const firstN = extractNumFlag(args, '--first');
  const lastN = extractNumFlag(args, '--last');

  let entries = readAll();
  if (statusFilter) entries = entries.filter((e) => e.status === statusFilter);
  if (verdictFilter) entries = entries.filter((e) => e.verdict === verdictFilter);
  if (projectFilter) entries = entries.filter((e) => e.project === projectFilter);

  if (!entries.length) {
    console.log('No matching dump entries.');
    return;
  }

  if (firstN !== undefined) entries = entries.slice(0, firstN);
  else if (lastN !== undefined) entries = entries.slice(-lastN);

  for (const e of entries) {
    const status = e.status === 'pending' ? '' : ` (${e.status})`;
    const verdict = e.verdict ? ` [${e.verdict}]` : '';
    const tix = e.tickets?.length ? ` -> ${e.tickets.join(', ')}` : '';
    console.log(`  ${e.id}${status}${verdict}${tix}`);
  }
  console.log(`\n${entries.length} dump(s)`);
};
