// verify-repo-structure.ts — repo structure invariants for Harness
// Standalone script: node --import tsx scripts/utils/verify-repo-structure.ts

import * as fs from 'node:fs';
import * as path from 'node:path';

const pkg = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8'));
const TICKET_PREFIX: string = pkg.ticketPrefix;
const TICKET_ID_RE = new RegExp(`^${TICKET_PREFIX}-\\d+$`);

const failures: string[] = [];

// ── 1. package.json scripts ──

const pkgPath = path.resolve('package.json');
if (!fs.existsSync(pkgPath)) {
  console.log('✗ package.json: not found');
  failures.push('package.json not found');
} else {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const required = ['build', 'format', 'lint', 'test', 'typecheck'];
  const missing = required.filter((s) => !pkg.scripts?.[s]);
  if (missing.length > 0) {
    console.log(`✗ package.json scripts: missing: ${missing.join(', ')}`);
    failures.push(`Missing scripts: ${missing.join(', ')}`);
  } else {
    console.log('✓ package.json: all required scripts present');
  }
}

// ── 2. tsconfig.json ──

const tsconfigPath = path.resolve('tsconfig.json');
if (!fs.existsSync(tsconfigPath)) {
  console.log('✗ tsconfig.json: not found');
  failures.push('tsconfig.json not found');
} else {
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
  if (!tsconfig.compilerOptions?.outDir) {
    console.log('✗ tsconfig.json: missing outDir');
    failures.push('tsconfig.json missing outDir');
  } else if (!tsconfig.compilerOptions?.strict) {
    console.log('✗ tsconfig.json: strict mode not enabled');
    failures.push('tsconfig.json strict mode disabled');
  } else {
    console.log('✓ tsconfig.json: valid (strict, outDir)');
  }
}

// ── 3. src/ directory ──

const srcPath = path.resolve('src');
if (!fs.existsSync(srcPath)) {
  console.log('✗ src/: directory missing');
  failures.push('src/ directory missing');
} else {
  const files = fs.readdirSync(srcPath).filter((f) => f.endsWith('.ts'));
  if (files.length === 0) {
    console.log('✗ src/: no TypeScript files found');
    failures.push('src/ is empty');
  } else {
    console.log(`✓ src/: ${files.length} TypeScript files`);
  }
}

// ── 4. test/ directory ──

const testPath = path.resolve('test');
if (!fs.existsSync(testPath)) {
  console.log('✗ test/: directory missing');
  failures.push('test/ directory missing');
} else {
  function countTests(dir: string): number {
    let count = 0;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        count += countTests(full);
      } else if (entry.name.endsWith('.test.ts')) {
        count++;
      }
    }
    return count;
  }
  const testFiles = countTests(testPath);
  if (testFiles === 0) {
    console.log('✗ test/: no test files found');
    failures.push('No test files in test/');
  } else {
    console.log(`✓ test/: ${testFiles} test files`);
  }
}

// ── 5. node_modules gitignored ──

const gitignorePath = path.resolve('.gitignore');
if (!fs.existsSync(gitignorePath)) {
  console.log('✗ .gitignore: not found');
  failures.push('.gitignore not found');
} else {
  const content = fs.readFileSync(gitignorePath, 'utf8');
  if (!content.includes('node_modules')) {
    console.log('✗ .gitignore: node_modules not gitignored');
    failures.push('node_modules not in .gitignore');
  } else {
    console.log('✓ .gitignore: node_modules properly gitignored');
  }
}

// ── 6. Ticket integrity ──

const ticketsPath = path.resolve('tickets.json');
if (fs.existsSync(ticketsPath)) {
  try {
    const data = JSON.parse(fs.readFileSync(ticketsPath, 'utf8'));
    if (!data.tickets || !Array.isArray(data.tickets)) {
      console.log('✗ tickets.json: missing tickets array');
      failures.push('tickets.json missing tickets array');
    } else {
      const invalidIds = data.tickets.filter((t: { id?: string }) => !t.id || !TICKET_ID_RE.test(t.id));
      if (invalidIds.length > 0) {
        console.log(`✗ tickets.json: ${invalidIds.length} tickets with invalid ID format`);
        failures.push(`${invalidIds.length} tickets with invalid ID format`);
      } else {
        console.log(`✓ tickets.json: ${data.tickets.length} tickets, all IDs valid`);
      }
    }
  } catch {
    console.log('✗ tickets.json: invalid JSON');
    failures.push('tickets.json invalid JSON');
  }
}

// ── 7. env example ──

const envExamplePath = path.resolve('.env.example');
if (!fs.existsSync(envExamplePath)) {
  console.log('✗ .env.example: not found');
  failures.push('.env.example not found');
} else {
  console.log('✓ .env.example: present');
}

// ── Summary ──

console.log('');
if (failures.length === 0) {
  console.log('All structure checks passed.');
  process.exit(0);
} else {
  console.log(`${failures.length} structure check(s) failed.`);
  process.exit(1);
}
