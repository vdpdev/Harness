import * as fs from 'node:fs';
import * as path from 'node:path';
import * as childProcess from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.ts';
import { REPO_ROOT } from '../test-coverage.js';
import { extractNumFlag } from './extract-num-flag.js';
import { requireStore } from './require-store.js';
import { execTestOnce } from './exec-test-once.js';
import { parseSummary } from './parse-summary.js';
import { analyzeFile } from './analyze-file.js';
import { now } from './now.js';
import { writeStore } from './write-store.js';

export const analyze = (args) => {
  const id = args[0];
  if (!id) {
    console.error('Usage: test-coverage.ts analyze <id> [--rerun N]');
    process.exit(1);
  }
  const rerun = extractNumFlag(args, '--rerun') ?? 1;
  const data = requireStore();
  const entry = data.entries.find((e) => e.id === id);
  if (!entry) {
    console.error(`Test entry ${id} not found.`);
    process.exit(1);
  }
  const absPath = path.resolve(REPO_ROOT, entry.id);

  const run = execTestOnce(absPath);
  const summary = parseSummary(run.stdout + run.stderr);
  const { assertionCount, testCount, findings } = analyzeFile(absPath, entry.classification);

  if (run.code !== 0 || summary.fail > 0) {
    findings.push(
      `failing — ${summary.fail} failing of ${summary.tests} tests` +
        (summary.failures.length ? `: ${summary.failures.slice(0, 3).join('; ')}` : ''),
    );
  }

  const outcomes = new Set([`${summary.pass}/${summary.fail}`]);
  for (let i = 1; i < rerun; i += 1) {
    const r2 = execTestOnce(absPath);
    const s2 = parseSummary(r2.stdout + r2.stderr);
    outcomes.add(`${s2.pass}/${s2.fail}`);
  }
  let flaky = false;
  if (outcomes.size > 1) {
    flaky = true;
    findings.push(`flaky — outcomes differ across ${rerun} runs: ${[...outcomes].join(', ')}`);
  }

  let strength = 100;
  if (testCount === 0) strength = 0;
  else {
    if (assertionCount === 0) strength -= 60;
    else if (assertionCount / testCount < 1) strength -= 25;
    if (entry.classification === 'shield' && assertionCount < 2) strength -= 25;
    if (run.code !== 0 || summary.fail > 0) strength -= 40;
    if (flaky) strength -= 20;
  }
  strength = Math.max(0, Math.min(100, strength));

  entry.strength = strength;
  entry.findings = findings.join('\n');
  entry.updatedAt = now();
  writeStore(data);

  console.log(`Analyzed ${id} (${entry.classification})`);
  console.log(`  strength: ${strength}/100`);
  console.log(`  tests: ${summary.tests}  pass: ${summary.pass}  fail: ${summary.fail}  suites: ${summary.suites}`);
  console.log(`  assertions: ${assertionCount}  cases: ${testCount}`);
  if (findings.length) {
    console.log('  findings:');
    for (const f of findings) console.log(`    - ${f}`);
  } else {
    console.log('  findings: (none — solid)');
  }
  return { strength, findings, summary };
};
