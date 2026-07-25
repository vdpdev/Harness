import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.ts';
import { status } from './status.js';

export const printEntry = (entry) => {
  console.log(`  id:         ${entry.id}`);
  console.log(`  project:    ${entry.project}`);
  console.log(`  status:     ${entry.status}`);
  if (entry.verdict) console.log(`  verdict:    ${entry.verdict}`);
  if (entry.tickets?.length) console.log(`  tickets:    ${entry.tickets.join(', ')}`);
  if (entry.notes) console.log(`  notes:      ${entry.notes}`);
  if (entry.createdAt) console.log(`  createdAt:  ${entry.createdAt}`);
  if (entry.updatedAt) console.log(`  updatedAt:  ${entry.updatedAt}`);
  if (entry.reviewedAt) console.log(`  reviewedAt: ${entry.reviewedAt}`);
};
