import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.js';
import { TICKETS_PATH } from '../tickets.js';
import { extractFlag } from './extract-flag.js';
import { readJson } from './read-json.js';
import { now } from './now.js';
import { withLock } from './with-lock.js';
import { writeJson } from './write-json.js';
import { TICKET_ID_FORMAT, isValidTicketId } from './config.js';

export const add = (args) => {
  const id = args[0];
  const title = args[1];
  if (!id || !title) {
    console.error('Usage: tickets.ts add <id> <title> [--notes "..."]');
    process.exit(1);
  }

  if (!isValidTicketId(id)) {
    console.error(`Ticket ID "${id}" must match ${TICKET_ID_FORMAT} format.`);
    process.exit(1);
  }

  const notes = extractFlag(args, '--notes');
  const blockedByRaw = extractFlag(args, '--blocked-by');
  const blockedBy = blockedByRaw
    ? blockedByRaw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const parent = extractFlag(args, '--parent');

  for (const dep of blockedBy) {
    if (!isValidTicketId(dep)) {
      console.error(`Blocked-by ID "${dep}" must match ${TICKET_ID_FORMAT} format.`);
      process.exit(1);
    }
  }

  if (parent && !isValidTicketId(parent)) {
    console.error(`Parent ID "${parent}" must match ${TICKET_ID_FORMAT} format.`);
    process.exit(1);
  }

  withLock(() => {
    const data = readJson(TICKETS_PATH) || { meta: {}, tickets: [] };
    if (!data.tickets) data.tickets = [];

    if (parent && !data.tickets.some((t) => t.id === parent)) {
      console.error(`Parent ticket ${parent} not found.`);
      process.exit(1);
    }

    if (data.tickets.some((t) => t.id === id)) {
      console.error(`Ticket ${id} already exists.`);
      process.exit(1);
    }

    const ticket: Record<string, unknown> = {
      id,
      title,
      status: 'open',
      blockedBy,
      notes: notes || '',
      createdAt: now(),
      updatedAt: now(),
    };

    if (parent) ticket.parent = parent;

    data.tickets.push(ticket);

    writeJson(TICKETS_PATH, data);
    console.log(`Created ${id}: ${title}`);
  });
};
