import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LOCK_PATH } from '../jsonstore.js';
import { pidAlive } from './pid-alive.js';

export const releaseLock = () => {
  try {
    const holder = Number(fs.readFileSync(LOCK_PATH, 'utf8').trim());
    if (holder && holder !== process.pid) {
      return;
    }
    fs.rmSync(LOCK_PATH, { force: true });
  } catch {
    // best-effort
  }
};
