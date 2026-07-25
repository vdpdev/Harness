import * as fs from 'node:fs';
import * as path from 'node:path';
import * as childProcess from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.ts';
import { readAll } from './read-all.js';

export const status = () => {
  const data = { entries: readAll() };
  const entries = data.entries ?? [];
  const counts = { pending: 0, inProgress: 0, reviewed: 0 };
  const verdicts = { improved: 0, clean: 0, ticketed: 0 };
  const allTickets = new Set();
  const byProject = new Map();
  for (const e of entries) {
    counts[e.status] = (counts[e.status] ?? 0) + 1;
    if (e.verdict) verdicts[e.verdict] = (verdicts[e.verdict] ?? 0) + 1;
    for (const t of e.ticketed ?? []) allTickets.add(t);
    const p = byProject.get(e.project) ?? { total: 0, reviewed: 0, sword: 0, shield: 0 };
    p.total += 1;
    if (e.status === 'reviewed') p.reviewed += 1;
    if (e.classification === 'sword') p.sword += 1;
    else if (e.classification === 'shield') p.shield += 1;
    byProject.set(e.project, p);
  }
  const total = entries.length;
  const pct = total ? Math.round((counts.reviewed / total) * 100) : 0;
  const sword = entries.filter((e) => e.classification === 'sword').length;
  const shield = entries.filter((e) => e.classification === 'shield').length;
  console.log(`Test-duel progress: ${counts.reviewed}/${total} reviewed (${pct}%)`);
  console.log(`  sword (product): ${sword}   shield (quality): ${shield}`);
  console.log(`  pending:    ${counts.pending}`);
  console.log(`  inProgress: ${counts.inProgress}`);
  console.log(`  reviewed:   ${counts.reviewed}`);

  const sortedTickets = [...allTickets].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  console.log(
    `\nTicket yield: ${verdicts.ticketed} test file(s) produced ${sortedTickets.length} ticket(s)` +
      `${sortedTickets.length ? ` (${sortedTickets.join(', ')})` : ''}; ${verdicts.improved} improved; ${verdicts.clean} clean.`,
  );

  const incomplete = [...byProject.entries()]
    .filter(([, p]) => p.reviewed < p.total)
    .sort((a, b) => a[0].localeCompare(b[0]));
  if (incomplete.length) {
    console.log(`\nIncomplete projects (${incomplete.length}):`);
    for (const [name, p] of incomplete)
      console.log(`  ${name}: ${p.reviewed}/${p.total} (sword ${p.sword}, shield ${p.shield})`);
  }
};
