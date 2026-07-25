import * as fs from 'node:fs';
import * as path from 'node:path';
import * as childProcess from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.ts';
import { CATEGORY } from '../test-coverage.js';
import { store } from './store.js';

export const readStore = () => {
  const out = store('list', '--category', CATEGORY, '--json');
  let records;
  try {
    records = JSON.parse(out);
  } catch {
    records = [];
  }
  if (!Array.isArray(records)) records = [];
  return { entries: records };
};
