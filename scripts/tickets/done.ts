import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.js';
import { TICKETS_PATH } from '../tickets.js';
import { extractFlag } from './extract-flag.js';
import { readJson } from './read-json.js';
import { isTicketDone } from './is-ticket-done.js';
import { now } from './now.js';
import { withLock } from './with-lock.js';
import { writeJson } from './write-json.js';

export const done = (args) => {
  const id = args[0];
  if (!id) {
    console.error('Usage: tickets.ts done <id> [--notes "..."]');
    process.exit(1);
  }

  const notes = extractFlag(args, '--notes');

  withLock(() => {
    const data = readJson(TICKETS_PATH);
    const ticketIndex = data?.tickets.findIndex((t) => t.id === id) ?? -1;
    if (ticketIndex < 0) {
      console.error(`Ticket ${id} not found.`);
      process.exit(1);
    }

    const ticket = data.tickets[ticketIndex];

    const { allowed, reason } = canTransition('ticket', ticket.status, 'done', ticket, { isDone: isTicketDone });
    if (!allowed) {
      console.error(`Cannot mark ${id} done: ${reason}.`);
      process.exit(1);
    }

    if (notes) ticket.notes = notes;
    ticket.status = 'done';
    ticket.doneAt = now();

    writeJson(TICKETS_PATH, data);
    console.log(`Done ${id}: ${ticket.title}`);
  });
};
