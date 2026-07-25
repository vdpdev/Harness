import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.js';
import { TICKETS_PATH } from '../tickets.js';
import { readJson } from './read-json.js';

export const show = (args) => {
  const id = args[0];
  if (!id) {
    console.error('Usage: tickets.ts show <id>');
    process.exit(1);
  }

  const data = readJson(TICKETS_PATH);
  let ticket = data?.tickets.find((t) => t.id === id);

  if (!ticket) {
    console.error(`Ticket ${id} not found.`);
    process.exit(1);
  }

  console.log(`  id:        ${ticket.id}`);
  console.log(`  title:     ${ticket.title}`);
  console.log(`  status:    ${ticket.status || 'done'}`);
  if (ticket.parent) console.log(`  parent:    ${ticket.parent}`);
  if (ticket.blockedBy?.length) console.log(`  blockedBy: ${ticket.blockedBy.join(', ')}`);
  if (ticket.notes) console.log(`  notes:     ${ticket.notes}`);
  if (ticket.createdAt) console.log(`  createdAt: ${ticket.createdAt}`);
  if (ticket.updatedAt) console.log(`  updatedAt: ${ticket.updatedAt}`);
  if (ticket.doneAt) console.log(`  doneAt:    ${ticket.doneAt}`);
};
