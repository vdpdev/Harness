import * as fs from 'node:fs';
import * as path from 'node:path';
import * as childProcess from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.ts';

export const analyzeFile = (absPath, classification) => {
  let body = '';
  try {
    body = fs.readFileSync(absPath, 'utf8');
  } catch {
    body = '';
  }
  const assertionCount = (body.match(/\bassert\b|\.assert[A-Z]|expect\(/g) || []).length;
  const testCount = (body.match(/(?<![\w.])(it|test)\s*\(/g) || []).length;

  const findings = [];
  if (testCount === 0) findings.push('no test cases defined (empty file)');
  if (assertionCount === 0 && testCount > 0)
    findings.push('test cases present but zero assertions (weak/always-passes smell)');
  else if (testCount > 0 && assertionCount / testCount < 1)
    findings.push(`low assertion density (${assertionCount} assertions / ${testCount} cases) — sword-gap risk`);

  if (classification === 'shield' && assertionCount < 2)
    findings.push('shield test asserts little — quality-regression guard is likely a no-op');

  return { assertionCount, testCount, findings };
};
