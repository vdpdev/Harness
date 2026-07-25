import * as fs from 'node:fs';
import * as path from 'node:path';
import * as childProcess from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.ts';
import { REPO_ROOT } from '../test-coverage.js';
import { extractFlag } from './extract-flag.js';
import { walk } from './walk.js';
import { readStore } from './read-store.js';
import { idFor } from './id-for.js';
import { projectFor } from './project-for.js';
import { classifyFile } from './classify-file.js';
import { status } from './status.js';
import { now } from './now.js';
import { writeStore } from './write-store.js';

export const init = (args) => {
  const rootArg = extractFlag(args, '--root');
  const reset = args.includes('--reset');
  const scanRoot = rootArg ? path.resolve(REPO_ROOT, rootArg) : REPO_ROOT;

  const absPaths = walk(scanRoot, []);
  const discovered = absPaths
    .map((abs) => path.relative(REPO_ROOT, abs))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const existing = reset ? null : readStore();
  const byId = new Map((existing?.entries ?? []).map((e) => [e.id, e]));

  let added = 0;
  let removed = 0;
  const seen = new Set();

  const entries = [];
  for (const relPath of discovered) {
    const id = idFor(relPath);
    seen.add(id);
    const prev = byId.get(id);
    if (prev) {
      entries.push({
        id,
        path: id,
        project: prev.project ?? projectFor(relPath),
        classification: prev.classification ?? classifyFile(relPath),
        status: prev.status ?? 'pending',
        verdict:
          prev.verdict ??
          (prev.status === 'reviewed'
            ? prev.ticketed?.length
              ? 'ticketed'
              : prev.findings
                ? 'improved'
                : 'clean'
            : null),
        notes: prev.notes ?? '',
        findings: prev.findings ?? '',
        ticketed: prev.ticketed ?? [],
        strength: prev.strength ?? null,
        createdAt: prev.createdAt ?? now(),
        updatedAt: prev.updatedAt ?? now(),
        ...(prev.reviewedAt ? { reviewedAt: prev.reviewedAt } : {}),
      });
    } else {
      added += 1;
      entries.push({
        id,
        path: id,
        project: projectFor(relPath),
        classification: classifyFile(relPath),
        status: 'pending',
        verdict: null,
        notes: '',
        findings: '',
        ticketed: [],
        strength: null,
        createdAt: now(),
        updatedAt: now(),
      });
    }
  }

  for (const id of byId.keys()) {
    if (!seen.has(id)) removed += 1;
  }

  entries.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

  writeStore({
    meta: {
      goal: 'Resumable coverage/pacing harness for the Sword-vs-Shield test-coverage. Entries here are NOT tickets.',
      scannedAt: now(),
      total: entries.length,
    },
    entries,
  });

  console.log(
    `Initialized coverage (jsonstore category "coverage"): ${entries.length} test file(s) across ${new Set(entries.map((e) => e.project)).size} project(s). ` +
      `${added} new, ${removed} stale removed${reset ? ' (reset)' : ''}.`,
  );
};
