import * as fs from 'node:fs';
import * as path from 'node:path';
import { walkTxt } from './walk-txt.js';

export const getTotalSize = (dir: string): string => {
  let totalBytes = 0;
  for (const file of walkTxt(dir)) {
    totalBytes += fs.statSync(file).size;
  }
  if (totalBytes < 1024) return `${totalBytes} B`;
  if (totalBytes < 1024 * 1024) return `${(totalBytes / 1024).toFixed(1)} KB`;
  return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
};
