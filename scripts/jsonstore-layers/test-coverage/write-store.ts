import * as fs from 'node:fs';
import * as path from 'node:path';
import * as childProcess from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.ts';
import { CATEGORY } from '../test-coverage.js';
import { store } from './store.js';

export const writeStore = (data) => {
  const entries = data.entries ?? [];
  if (entries.length === 0) return;

  const patch = Object.fromEntries(entries.map((e) => [e.id, { id: e.id, category: CATEGORY, ...e }]));
  store('set-fields-batch', '--json', JSON.stringify(patch));
};
