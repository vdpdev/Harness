import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.js';
import { TICKETS_PATH } from '../tickets.js';
import { readJson } from './read-json.js';

export const blocked = () => {
  const data = readJson(TICKETS_PATH);
  if (!data || !data.tickets.length) {
    console.log('No tickets.');
    return;
  }

  const doneIds = new Set(data.tickets.filter((t) => t.status === 'done').map((t) => t.id));

  const blockedTickets = data.tickets.filter((t) => t.blockedBy?.length && t.blockedBy.some((b) => !doneIds.has(b)));

  if (!blockedTickets.length) {
    console.log('No blocked tickets.');
    return;
  }

  for (const t of blockedTickets) {
    const unresolved = t.blockedBy.filter((b) => !doneIds.has(b));
    console.log(`  ${t.id}: ${t.title} — waiting on ${unresolved.join(', ')}`);
  }
  console.log(`\n${blockedTickets.length} blocked ticket(s)`);
};
