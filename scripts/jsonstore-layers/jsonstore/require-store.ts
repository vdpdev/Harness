import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readStore } from './read-store.js';

export const requireStore = () => {
  const data = readStore();
  if (!data) {
    console.error('temp.json not found. Run: node scripts/jsonstore.ts init');
    process.exit(1);
  }
  return data;
};
