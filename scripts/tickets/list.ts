import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.js';
import { TICKETS_PATH } from '../tickets.js';
import { extractFlag } from './extract-flag.js';
import { extractNumFlag } from './extract-num-flag.js';
import { readJson } from './read-json.js';
import { blocked } from './blocked.js';

export const list = (args) => {
  const statusFilter = extractFlag(args, '--status');
  const firstN = extractNumFlag(args, '--first');
  const lastN = extractNumFlag(args, '--last');
  const sortOrder = extractFlag(args, '--sort') ?? 'asc';

  const activeData = readJson(TICKETS_PATH) || { meta: {}, tickets: [] };
  const allTickets = activeData.tickets ?? [];

  if (!allTickets.length) {
    console.log(statusFilter ? `No tickets with status "${statusFilter}".` : 'No tickets.');
    return;
  }

  let tickets = statusFilter ? allTickets.filter((t) => t.status === statusFilter) : allTickets;

  if (!tickets.length) {
    console.log(statusFilter ? `No tickets with status "${statusFilter}".` : 'No tickets.');
    return;
  }

  tickets.sort((a, b) => {
    const cmp = a.id.localeCompare(b.id, undefined, { numeric: true });
    return sortOrder === 'desc' ? -cmp : cmp;
  });

  if (firstN !== undefined) tickets = tickets.slice(0, firstN);
  else if (lastN !== undefined) tickets = tickets.slice(-lastN);

  for (const t of tickets) {
    const blocked = t.blockedBy?.length ? ` [blocked by ${t.blockedBy.join(', ')}]` : '';
    const parent = t.parent ? ` (parent: ${t.parent})` : '';
    const status = t.status === 'open' ? '' : ` (${t.status})`;
    console.log(`  ${t.id}${status}: ${t.title}${blocked}${parent}`);
  }
  console.log(`\n${tickets.length} ticket(s)`);
};
