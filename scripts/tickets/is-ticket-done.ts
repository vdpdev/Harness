import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.js';
import { TICKETS_PATH } from '../tickets.js';
import { readJson } from './read-json.js';

export const isTicketDone = (id) => {
  const data = readJson(TICKETS_PATH);
  const ticket = (data?.tickets ?? []).find((t) => t.id === id);
  return Boolean(ticket && ticket.status === 'done');
};
