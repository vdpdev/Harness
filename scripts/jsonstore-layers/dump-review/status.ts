import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.ts';
import { readAll } from './read-all.js';

export const status = () => {
  const entries = readAll();
  const counts = { pending: 0, inProgress: 0, reviewed: 0 };
  const verdicts = { clean: 0, ticketed: 0 };
  const allTickets = new Set();
  const byProject = new Map();
  for (const e of entries) {
    counts[e.status] = (counts[e.status] ?? 0) + 1;
    if (e.verdict) verdicts[e.verdict] = (verdicts[e.verdict] ?? 0) + 1;
    for (const t of e.tickets ?? []) allTickets.add(t);
    const p = byProject.get(e.project) ?? { total: 0, reviewed: 0 };
    p.total += 1;
    if (e.status === 'reviewed') p.reviewed += 1;
    byProject.set(e.project, p);
  }
  const total = entries.length;
  const pct = total ? Math.round((counts.reviewed / total) * 100) : 0;
  console.log(`Dump review progress: ${counts.reviewed}/${total} reviewed (${pct}%)`);
  console.log(`  pending:    ${counts.pending}`);
  console.log(`  inProgress: ${counts.inProgress}`);
  console.log(`  reviewed:   ${counts.reviewed}`);

  const sortedTickets = [...allTickets].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  console.log(
    `\nTicket yield: ${verdicts.ticketed} dump(s) produced ${sortedTickets.length} ticket(s)` +
      `${sortedTickets.length ? ` (${sortedTickets.join(', ')})` : ''}; ${verdicts.clean} clean.`,
  );

  const incomplete = [...byProject.entries()]
    .filter(([, p]) => p.reviewed < p.total)
    .sort((a, b) => a[0].localeCompare(b[0]));
  if (incomplete.length) {
    console.log(`\nIncomplete projects (${incomplete.length}):`);
    for (const [name, p] of incomplete) console.log(`  ${name}: ${p.reviewed}/${p.total}`);
  }
};
