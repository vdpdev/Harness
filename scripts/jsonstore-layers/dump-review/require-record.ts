import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.ts';

export const requireRecord = (entries, id) => {
  const entry = entries.find((e) => e.id === id);
  if (!entry) {
    console.error(`Dump entry ${id} not found.`);
    process.exit(1);
  }
  return entry;
};
