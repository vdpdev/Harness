#!/usr/bin/env node --import tsx
/**
 * Test runner wrapper that appends a failure summary at the bottom of the output.
 *
 * Usage:  node --import tsx test/helpers/run-tests-with-summary.ts [extra node --test args...]
 *
 * Captures all test output, then reprints every failure with location + error at the bottom
 * so the developer doesn't have to scroll through thousands of lines to find what broke.
 */

import { spawn } from 'node:child_process';
import * as path from 'node:path';

interface Failure {
  name: string;
  file: string;
  error: string;
  code?: string;
  location?: string;
}

const testFiles = process.argv.slice(2).filter((a) => a.endsWith('.ts'));
const extraArgs = process.argv.slice(2).filter((a) => !a.endsWith('.ts'));

const child = spawn(
  process.execPath,
  ['--import', 'tsx', '--test', ...extraArgs, ...testFiles.map((f) => path.resolve(f))],
  {
    stdio: ['inherit', 'pipe', 'pipe'],
    env: process.env,
  },
);

const chunks: Buffer[] = [];
child.stdout?.on('data', (chunk: Buffer) => {
  process.stdout.write(chunk);
  chunks.push(chunk);
});
child.stderr?.on('data', (chunk: Buffer) => {
  process.stderr.write(chunk);
  chunks.push(chunk);
});

child.on('close', (code) => {
  const output = Buffer.concat(chunks).toString('utf8');
  const failures = parseFailures(output);

  if (failures.length > 0) {
    const sep = '═'.repeat(64);
    const lines = ['', sep, `  FAILURES SUMMARY — ${failures.length} test(s) failed`, sep, ''];

    for (let idx = 0; idx < failures.length; idx++) {
      const f = failures[idx];
      lines.push(`  ${idx + 1}. ${f.name}`);
      if (f.location) lines.push(`     ${f.location}`);
      if (f.code) lines.push(`     Code: ${f.code}`);
      // Show first 5 lines of error, trimmed
      const errLines = f.error
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 5);
      for (const l of errLines) {
        lines.push(`     ${l}`);
      }
      lines.push('');
    }

    lines.push(sep);
    lines.push('');

    process.stderr.write(lines.join('\n'));
  }

  process.exit(code ?? 1);
});

function parseFailures(output: string): Failure[] {
  const failures: Failure[] = [];
  const lines = output.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    const notOkMatch = line.match(/^(\s*)not ok\s+\d+\s*-?\s*(.*)/);
    if (notOkMatch) {
      const testName = notOkMatch[2].trim() || '(unnamed test)';

      // Skip suite-level "not ok" (subtestsFailed) — only report leaf test failures
      let error = '';
      let code: string | undefined;
      let location: string | undefined;

      // Scan the block between "not ok" and the next "ok"/"not ok"/"..."
      let j = i + 1;
      while (j < lines.length) {
        const next = lines[j];
        if (next.match(/^(ok|not ok)\s+\d+/) || next.trim() === '...') break;

        const trimmed = next.trim();

        if (trimmed.startsWith('error:') || trimmed.startsWith('error: |')) {
          // Capture the error value (may be multi-line with |-
          const errStart = trimmed.replace(/^error:\s*\|?-?\s*/, '');
          if (errStart) {
            error += errStart;
          } else {
            // Multi-line: next indented lines are the error
            j++;
            while (j < lines.length) {
              const errLine = lines[j];
              if (
                errLine.match(/^\s{4,}/) &&
                !errLine.trim().startsWith('code:') &&
                !errLine.trim().startsWith('name:') &&
                !errLine.trim().startsWith('operator:')
              ) {
                error += (error ? '\n' : '') + errLine.trim();
                j++;
              } else {
                break;
              }
            }
            continue;
          }
        } else if (trimmed.startsWith('code:')) {
          code = trimmed.replace(/^code:\s*['"]?|['"]$/g, '');
        } else if (trimmed.startsWith('location:')) {
          location = trimmed.replace(/^location:\s*['"]?|['"]$/g, '');
        } else if (trimmed.startsWith('failureType:') && !error) {
          // Use failureType as fallback error
          error = trimmed.replace(/^failureType:\s*/, '');
        }

        j++;
      }

      if (error || testName) {
        failures.push({
          name: testName,
          file: location ? location.split(':').slice(0, -2).join(':') : 'unknown',
          error: error || '(no error details)',
          code,
          location,
        });
      }

      i = j;
      continue;
    }

    i++;
  }

  return failures;
}
