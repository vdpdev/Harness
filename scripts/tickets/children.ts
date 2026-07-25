import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.js';
import { TICKETS_PATH } from '../tickets.js';
import { readJson } from './read-json.js';
import { blocked } from './blocked.js';
import { TICKET_ID_FORMAT, isValidTicketId } from './config.js';

export const children = (args) => {
  const parentId = args[0];
  if (!parentId) {
    console.error('Usage: tickets.ts children <parent-id>');
    process.exit(1);
  }

  if (!isValidTicketId(parentId)) {
    console.error(`Parent ID "${parentId}" must match ${TICKET_ID_FORMAT} format.`);
    process.exit(1);
  }

  const data = readJson(TICKETS_PATH);
  if (!data || !data.tickets.length) {
    console.log('No tickets.');
    return;
  }

  const parentExists = data.tickets.some((t) => t.id === parentId);
  if (!parentExists) {
    console.error(`Ticket ${parentId} not found.`);
    process.exit(1);
  }

  const childTickets = data.tickets.filter((t) => t.parent === parentId);

  if (!childTickets.length) {
    console.log(`No children for ${parentId}.`);
    return;
  }

  for (const t of childTickets) {
    const blocked = t.blockedBy?.length ? ` [blocked by ${t.blockedBy.join(', ')}]` : '';
    const status = t.status === 'open' ? '' : ` (${t.status})`;
    console.log(`  ${t.id}${status}: ${t.title}${blocked}`);
  }
  console.log(`\n${childTickets.length} child ticket(s)`);
};
