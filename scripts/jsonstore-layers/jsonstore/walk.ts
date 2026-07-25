import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { IGNORED_DIR_SEGMENTS } from '../jsonstore.js';

export const walk = (dir, suffix, acc) => {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (IGNORED_DIR_SEGMENTS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), suffix, acc);
    } else if (entry.isFile() && entry.name.endsWith(suffix)) {
      acc.push(path.join(dir, entry.name));
    }
  }
  return acc;
};
