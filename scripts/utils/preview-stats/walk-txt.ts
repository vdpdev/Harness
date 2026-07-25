import * as fs from 'node:fs';
import * as path from 'node:path';
import { isTxt } from './is-txt.js';

export const walkTxt = (dir: string): string[] => {
  if (!fs.existsSync(dir)) return [];
  const acc: string[] = [];
  const entries = fs.readdirSync(dir, { recursive: true, withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile() && isTxt(entry.name)) {
      const parentDir = (entry as { parentPath?: string }).parentPath ?? dir;
      acc.push(path.join(parentDir, entry.name));
    }
  }
  return acc;
};
