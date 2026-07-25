import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.ts';
import { CATEGORY } from '../dump-review.js';
import { storeWrite } from './store-write.js';

export const writeRecord = (id, patch) => {
  storeWrite('set-fields', id, '--json', JSON.stringify({ id, category: CATEGORY, ...patch }));
};
