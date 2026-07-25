import * as ts from 'typescript';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT } from '../check-test-health.js';

export const isSourceFile = (p: string): boolean => {
  if (!p.endsWith('.ts')) return false;
  if (p.endsWith('.test.ts') || p.endsWith('.spec.ts') || p.endsWith('.d.ts')) return false;
  // Skip files under node_modules, dist, .tmp
  const rel = path.relative(ROOT, p);
  if (rel.startsWith('node_modules') || rel.startsWith('dist') || rel.startsWith('.tmp')) return false;
  if (rel.startsWith('test/')) return false;
  if (rel.startsWith('scripts/')) return false;
  return true;
};
