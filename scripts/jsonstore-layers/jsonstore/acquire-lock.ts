import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LOCK_PATH, LOCK_RETRY_MS, LOCK_TIMEOUT_MS } from '../jsonstore.js';
import { now } from './now.js';
import { pidAlive } from './pid-alive.js';

export const acquireLock = () => {
  const deadline = Date.now() + LOCK_TIMEOUT_MS;
  for (;;) {
    try {
      const fd = fs.openSync(LOCK_PATH, 'wx');
      fs.writeSync(fd, `${process.pid}\n`);
      fs.closeSync(fd);
      return;
    } catch (err) {
      if (err.code === 'EEXIST') {
        if (Date.now() >= deadline) {
          throw new Error(
            `jsonstore: could not acquire lock ${LOCK_PATH} within ${LOCK_TIMEOUT_MS}ms ` +
              `(held by another process — concurrent writes would clobber records)`,
          );
        }
        // Stale lock guard: if the holder PID no longer exists, break it.
        try {
          const holder = Number(fs.readFileSync(LOCK_PATH, 'utf8').trim());
          if (holder && holder !== process.pid && !pidAlive(holder)) {
            fs.rmSync(LOCK_PATH, { force: true });
            continue;
          }
        } catch {
          // lock vanished between open and read — loop will retry
        }
        const spin = Date.now();
        while (Date.now() - spin < LOCK_RETRY_MS) {
          Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, LOCK_RETRY_MS);
        }
        continue;
      }
      throw err;
    }
  }
};
