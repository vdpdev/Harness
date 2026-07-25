import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_GLOB, REPO_ROOT, STORE_PATH } from '../jsonstore.js';
import { extractFlag } from './extract-flag.js';
import { reset } from './reset.js';
import { globToSuffix } from './glob-to-suffix.js';
import { walk } from './walk.js';
import { readStore } from './read-store.js';
import { idFor } from './id-for.js';
import { get } from './get.js';
import { now } from './now.js';
import { withLock } from './with-lock.js';
import { writeStore } from './write-store.js';

export const init = (args) => {
  const category = extractFlag(args, '--category') ?? 'scratch';
  const rootArg = extractFlag(args, '--root');
  const reset = args.includes('--reset');
  const glob = extractFlag(args, '--glob') ?? DEFAULT_GLOB;
  const suffix = globToSuffix(glob);
  const scanRoot = rootArg ? path.resolve(REPO_ROOT, rootArg) : REPO_ROOT;

  const absPaths = walk(scanRoot, suffix, []);
  const discovered = absPaths
    .map((abs) => path.relative(REPO_ROOT, abs))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const existing = reset ? null : readStore();
  const byId = new Map((existing?.records ?? []).map((r) => [r.id, r]));

  let added = 0;
  let removed = 0;
  const seen = new Set();

  const records = [];
  for (const relPath of discovered) {
    const id = idFor(relPath);
    seen.add(id);
    const prev = byId.get(id);
    if (prev) {
      // Preserve prior progress across re-scans; backfill newer fields.
      records.push({
        id,
        category: prev.category ?? category,
        ...prev.fields,
        createdAt: prev.createdAt ?? now(),
        updatedAt: now(),
        ...(prev.doneAt ? { doneAt: prev.doneAt } : {}),
      });
    } else {
      added += 1;
      records.push({
        id,
        category,
        createdAt: now(),
        updatedAt: now(),
      });
    }
  }

  // Records whose file no longer exists on disk are dropped on a re-scan.
  for (const id of byId.keys()) {
    if (!seen.has(id)) removed += 1;
  }

  records.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

  withLock(() =>
    writeStore({
      meta: {
        goal: 'Generic JSON-backed CRUD store (JSON-Redis) for ad-hoc agent work. Records are NOT tickets — they hold disposable progress that must not enter the repo. Wipe with init --reset. Store file (.tmp/temp.json) is gitignored. This module owns NO FSM; layers built on top enforce their own.',
        storePath: path.relative(REPO_ROOT, STORE_PATH),
        initializedAt: now(),
        total: records.length,
      },
      records,
    }),
  );

  console.log(
    `Initialized temp.json: ${records.length} record(s) for category "${category}" (glob "${glob}"). ` +
      `${added} new, ${removed} stale removed${reset ? ' (reset)' : ''}. Store: ${STORE_PATH}`,
  );
};
