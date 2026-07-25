import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.js';
import { acquireLock } from './acquire-lock.js';
import { releaseLock } from './release-lock.js';

export const withLock = (fn) => {
  acquireLock();
  try {
    return fn();
  } finally {
    releaseLock();
  }
};
