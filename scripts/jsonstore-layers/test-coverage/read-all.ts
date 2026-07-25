import * as fs from 'node:fs';
import * as path from 'node:path';
import * as childProcess from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.ts';
import { readStore } from './read-store.js';

export const readAll = () => {
  try {
    const data = readStore();
    return data?.entries ?? [];
  } catch {
    return [];
  }
};
