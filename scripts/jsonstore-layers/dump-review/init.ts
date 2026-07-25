import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.ts';
import { CATEGORY, REPO_ROOT } from '../dump-review.js';
import { extractFlag } from './extract-flag.js';
import { walk } from './walk.js';
import { readAll } from './read-all.js';
import { idFor } from './id-for.js';
import { projectFor } from './project-for.js';
import { status } from './status.js';
import { storeWrite } from './store-write.js';
import { writeRecord } from './write-record.js';

export const init = (args) => {
  const rootArg = extractFlag(args, '--root');
  const reset = args.includes('--reset');
  const scanRoot = rootArg ? path.resolve(REPO_ROOT, rootArg) : REPO_ROOT;

  const absPaths = walk(scanRoot, false, []);
  const discovered = absPaths
    .map((abs) => path.relative(REPO_ROOT, abs))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const existing = reset ? [] : readAll();
  const byId = new Map(existing.map((e) => [e.id, e]));

  let added = 0;
  let removed = 0;
  const seen = new Set();
  const entries = [];

  for (const relPath of discovered) {
    const id = idFor(relPath);
    seen.add(id);
    const prev = byId.get(id);
    if (prev) {
      // Preserve review progress across re-scans.
      entries.push({
        id,
        path: id,
        project: projectFor(relPath),
        status: prev.status ?? 'pending',
        verdict: prev.verdict ?? (prev.status === 'reviewed' ? (prev.tickets?.length ? 'ticketed' : 'clean') : null),
        notes: prev.notes ?? '',
        tickets: prev.tickets ?? [],
        createdAt: prev.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...(prev.reviewedAt ? { reviewedAt: prev.reviewedAt } : {}),
      });
    } else {
      added += 1;
      entries.push({
        id,
        path: id,
        project: projectFor(relPath),
        status: 'pending',
        verdict: null,
        notes: '',
        tickets: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  for (const id of byId.keys()) {
    if (!seen.has(id)) removed += 1;
  }

  // Replace the category wholesale (reset + rewrite) so dropped/stale files are
  // actually removed from the jsonstore — jsonstore has no partial delete in the
  // layer's hot path.
  storeWrite('reset', '--category', CATEGORY);
  for (const e of entries) writeRecord(e.id, e);

  const projects = new Set(entries.map((e) => e.project).filter(Boolean));
  console.log(
    `Initialized runartifacts (jsonstore category "${CATEGORY}"): ${entries.length} dump(s) across ${projects.size} project(s). ` +
      `${added} new, ${removed} stale removed${reset ? ' (reset)' : ''}.`,
  );
};
