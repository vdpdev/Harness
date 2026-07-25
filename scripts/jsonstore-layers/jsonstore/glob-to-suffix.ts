import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

export const globToSuffix = (glob) => {
  if (!glob) return '';
  const seg = glob.split('/').pop();
  if (!seg) return '';
  if (seg.startsWith('*')) return seg.slice(1);
  return glob;
};
