import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { STORE_PATH } from '../jsonstore.js';

export const readStore = () => {
  if (!fs.existsSync(STORE_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
  } catch (err) {
    console.error(`Failed to parse ${STORE_PATH}: ${err.message}`);
    console.error(
      'The store may be corrupted. Run: node --import tsx scripts/jsonstore-layers/jsonstore.ts init --reset',
    );
    process.exit(1);
  }
};
