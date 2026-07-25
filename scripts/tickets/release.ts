import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.js';
import { TICKETS_PATH } from '../tickets.js';
import { isTicketDone } from './is-ticket-done.js';
import { readJson } from './read-json.js';
import { now } from './now.js';
import { withLock } from './with-lock.js';
import { writeJson } from './write-json.js';

export const release = (args) => {
  const id = args[0];
  if (!id) {
    console.error('Usage: tickets.ts release <id>');
    process.exit(1);
  }

  withLock(() => {
    const data = readJson(TICKETS_PATH);
    const ticket = data?.tickets.find((t) => t.id === id);
    if (!ticket) {
      console.error(`Ticket ${id} not found.`);
      process.exit(1);
    }

    const { allowed, reason } = canTransition('ticket', ticket.status, 'release', ticket, { isDone: isTicketDone });
    if (!allowed) {
      console.error(`Cannot release ${id}: ${reason}.`);
      process.exit(1);
    }

    const prev = ticket.status;
    ticket.status = 'open';
    ticket.updatedAt = now();
    writeJson(TICKETS_PATH, data);
    console.log(`Released ${id} (was ${prev}, now open)`);
  });
};
