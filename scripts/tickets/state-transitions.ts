import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.js';
import { TICKETS_PATH } from '../tickets.js';
import { readJson } from './read-json.js';
import { isTicketDone } from './is-ticket-done.js';

export const stateTransitions = (args) => {
  const id = args[0];
  if (!id) {
    console.error('Usage: tickets.ts stateTransitions <id>');
    process.exit(1);
  }

  const data = readJson(TICKETS_PATH);
  let ticket = data?.tickets.find((t) => t.id === id);
  let status = ticket?.status ?? 'open';
  if (!ticket) {
    console.error(`Ticket ${id} not found.`);
    process.exit(1);
  }

  console.log(formatStateTransitions('ticket', status, ticket, { isDone: isTicketDone }));
};
