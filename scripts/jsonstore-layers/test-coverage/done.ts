import * as fs from 'node:fs';
import * as path from 'node:path';
import * as childProcess from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.ts';
import { noBlockers } from '../test-coverage.js';
import { extractFlag } from './extract-flag.js';
import { requireStore } from './require-store.js';
import { status } from './status.js';
import { now } from './now.js';
import { writeStore } from './write-store.js';

export const done = (args) => {
  const id = args[0];
  if (!id) {
    console.error(
      'Usage: test-coverage.ts done <id> [--notes "..."] [--findings "..."] [--ticketed "PREFIX-1,PREFIX-2"]',
    );
    process.exit(1);
  }
  const notes = extractFlag(args, '--notes');
  const findings = extractFlag(args, '--findings');
  const ticketed = extractFlag(args, '--ticketed');
  const data = requireStore();
  const entry = data.entries.find((e) => e.id === id);
  if (!entry) {
    console.error(`Test entry ${id} not found.`);
    process.exit(1);
  }
  const { allowed, reason } = canTransition('coverage', entry.status, 'done', entry, noBlockers);
  if (!allowed) {
    console.error(`Cannot mark ${id} done: ${reason}.`);
    process.exit(1);
  }
  if (notes) entry.notes = notes;
  if (findings !== undefined) entry.findings = findings;
  if (ticketed)
    entry.ticketed = ticketed
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  entry.verdict = entry.ticketed?.length ? 'ticketed' : entry.findings?.trim() ? 'improved' : 'clean';
  entry.status = 'reviewed';
  entry.reviewedAt = now();
  entry.updatedAt = now();
  writeStore(data);
  console.log(
    `Reviewed ${id} [${entry.verdict}]` +
      `${entry.ticketed?.length ? ` — filed ${entry.ticketed.join(', ')}` : ''}` +
      `${entry.findings?.trim() ? ' — findings recorded' : ''}`,
  );
};
