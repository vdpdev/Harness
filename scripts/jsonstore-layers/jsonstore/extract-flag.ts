import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

export const extractFlag = (args, flag) => {
  const idx = args.indexOf(flag);
  if (idx < 0) return undefined;
  const value = args[idx + 1];
  if (!value || value.startsWith('-')) {
    console.error(`Flag ${flag} requires a value.`);
    process.exit(1);
  }
  return value;
};
