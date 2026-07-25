import * as ts from 'typescript';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT } from '../check-test-health.js';

export const findTestFile = (sourceFile: string): string | null => {
  const rel = path.relative(path.join(ROOT, 'src'), sourceFile);
  const base = rel.replace(/\.ts$/, '');

  // Pattern 1: test/<same-path>.test.ts  (e.g. src/catalog/db.ts → test/catalog/db.test.ts)
  const pattern1 = path.join(ROOT, 'test', `${base}.test.ts`);
  if (fs.existsSync(pattern1)) return pattern1;

  // Pattern 2: test/<basename>.test.ts  (e.g. src/catalog/db.ts → test/db.test.ts)
  const basename = path.basename(base);
  const pattern2 = path.join(ROOT, 'test', `${basename}.test.ts`);
  if (fs.existsSync(pattern2)) return pattern2;

  return null;
};
