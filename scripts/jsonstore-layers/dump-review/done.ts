import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.ts';
import { noBlockers } from '../dump-review.js';
import { extractFlag } from './extract-flag.js';
import { readAll } from './read-all.js';
import { requireRecord } from './require-record.js';
import { status } from './status.js';
import { writeRecord } from './write-record.js';

export const done = (args) => {
  const id = args[0];
  if (!id) {
    console.error('Usage: dump-review.ts done <id> [--notes "..."] [--tickets "PREFIX-1,PREFIX-2"]');
    process.exit(1);
  }
  const notes = extractFlag(args, '--notes');
  const tickets = extractFlag(args, '--tickets');
  const entries = readAll();
  const entry = requireRecord(entries, id);
  const { allowed, reason } = canTransition('runartifacts', entry.status, 'done', entry, noBlockers);
  if (!allowed) {
    console.error(`Cannot mark ${id} done: ${reason}.`);
    process.exit(1);
  }
  const ticketList = tickets
    ? tickets
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : (entry.tickets ?? []);
  const verdict = ticketList.length ? 'ticketed' : 'clean';
  const now = new Date().toISOString();
  writeRecord(id, {
    notes: notes ?? entry.notes ?? '',
    tickets: ticketList,
    verdict,
    status: 'reviewed',
    reviewedAt: now,
    updatedAt: now,
  });
  console.log(`Reviewed ${id} [${verdict}]${ticketList.length ? ` — filed ${ticketList.join(', ')}` : ''}`);
};
