import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.js';
import { TICKETS_PATH } from '../tickets.js';
import { readJson } from './read-json.js';
import { isTicketDone } from './is-ticket-done.js';
import { now } from './now.js';
import { withLock } from './with-lock.js';
import { writeJson } from './write-json.js';

export const claim = (args) => {
  const id = args[0];
  if (!id) {
    console.error('Usage: tickets.ts claim <id>');
    process.exit(1);
  }

  withLock(() => {
    const data = readJson(TICKETS_PATH);
    const ticket = data?.tickets.find((t) => t.id === id);
    if (!ticket) {
      console.error(`Ticket ${id} not found.`);
      process.exit(1);
    }

    if (ticket.status === 'done') {
      console.error(`Ticket ${id} is already done.`);
      process.exit(1);
    }

    const { allowed, reason } = canTransition('ticket', ticket.status, 'claim', ticket, { isDone: isTicketDone });
    if (!allowed) {
      console.error(`Cannot claim ${id}: ${reason}.`);
      process.exit(1);
    }

    const prev = ticket.status;
    ticket.status = 'inProgress';
    ticket.updatedAt = now();
    writeJson(TICKETS_PATH, data);
    console.log(`Claimed ${id} (was ${prev}, now inProgress)`);
  });
};
