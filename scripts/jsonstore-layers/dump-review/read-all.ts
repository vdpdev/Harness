import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.ts';
import { CATEGORY } from '../dump-review.js';
import { storeRead } from './store-read.js';

export const readAll = () => {
  const out = storeRead('list', '--category', CATEGORY, '--json');
  try {
    const parsed = JSON.parse(out);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};
