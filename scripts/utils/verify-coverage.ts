// verify-coverage.ts — runs project health checks for Harness
// Standalone script: node --import tsx scripts/utils/verify-coverage.ts [--ci]

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execFileSync } from 'node:child_process';

const CI = process.argv.includes('--ci');

const failures: string[] = [];

// ── 1. Package.json scripts ──

const pkgPath = path.resolve('package.json');
if (!fs.existsSync(pkgPath)) {
  console.log('✗ package.json: not found');
  failures.push('package.json not found');
} else {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const required = ['build', 'format', 'lint', 'test', 'typecheck'];
  const missing = required.filter((s) => !pkg.scripts?.[s]);
  if (missing.length > 0) {
    console.log(`✗ package.json: missing scripts: ${missing.join(', ')}`);
    failures.push(`Missing scripts: ${missing.join(', ')}`);
  } else {
    console.log('✓ package.json: all required scripts present');
  }
}

// ── 2. Source tree ──

const expectedDirs = ['src', 'test', 'scripts'];
for (const dir of expectedDirs) {
  if (!fs.existsSync(path.resolve(dir))) {
    console.log(`✗ source tree: ${dir}/ directory missing`);
    failures.push(`Missing directory: ${dir}/`);
  }
}
if (failures.length === 0) {
  console.log('✓ source tree: src/, test/, scripts/ present');
}

// ── 3. Format check ──

try {
  execFileSync('npx', ['prettier', '--check', '.'], { encoding: 'utf8' });
  console.log('✓ format: prettier check passed');
} catch {
  console.log('✗ format: prettier check failed');
  failures.push('Prettier check failed');
}

// ── 4. Lint check ──

try {
  const maxWarnings = CI ? '0' : '999';
  execFileSync('npx', ['eslint', '--max-warnings=' + maxWarnings, '.'], { encoding: 'utf8' });
  console.log('✓ lint: eslint passed');
} catch {
  console.log('✗ lint: eslint failed');
  failures.push('ESLint check failed');
}

// ── 5. Repo hygiene ──

const SECRET_PATTERNS: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /sk-[A-Za-z0-9]{32,}/m, name: 'OpenAI/LLM API key' },
  { pattern: /(?:^|[\s"'`])ghp_[A-Za-z0-9]{36}/m, name: 'GitHub personal access token' },
  { pattern: /(?:^|[\s"'`])gho_[A-Za-z0-9]{36}/m, name: 'GitHub OAuth token' },
  {
    pattern: /(?:^|[\s"'`])sk_(?:live|test)_[A-Za-z0-9]{16,}/m,
    name: 'Stripe secret key',
  },
  { pattern: /(?:^|[\s"'`])AIza[0-9A-Za-z_-]{35}/m, name: 'GCP API key' },
  { pattern: /https?:\/\/[A-Za-z0-9_-]+:[A-Za-z0-9_-]+@/m, name: 'URL-embedded credentials' },
];

const SECRET_EXCLUDES = new Set(['test/', 'docs/', 'scripts/', '.env.example']);

const secretOffenders: Array<{ file: string; secret: string }> = [];
const trackedFiles: string[] = [];

function walkDir(dir: string, root: string): void {
  if (['node_modules', '.git', '.tmp', 'dist', '.husky'].includes(path.basename(dir))) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, root);
    } else if (/\.(ts|js|mjs|cjs|json|md|yml|yaml)$/.test(entry.name)) {
      const relPath = path.relative(root, fullPath);
      trackedFiles.push(relPath);
    }
  }
}

walkDir('.', '.');

for (const file of trackedFiles) {
  if (SECRET_EXCLUDES.has(file) || [...SECRET_EXCLUDES].some((ex) => file.startsWith(ex))) continue;
  let content: string;
  try {
    content = fs.readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  for (const { pattern, name } of SECRET_PATTERNS) {
    if (pattern.test(content)) {
      secretOffenders.push({ file, secret: name });
      break;
    }
  }
}

if (secretOffenders.length > 0) {
  const listed = secretOffenders.map((o) => `  ${o.file} — ${o.secret}`).join('\n');
  console.log(`✗ hygiene: ${secretOffenders.length} file(s) may contain secrets:\n${listed}`);
  failures.push(`${secretOffenders.length} file(s) may contain committed secrets`);
} else {
  console.log('✓ hygiene: no secrets detected');
}

// ── 6. Ticket integrity ──

const ticketsPath = path.resolve('tickets.json');
if (fs.existsSync(ticketsPath)) {
  try {
    const data = JSON.parse(fs.readFileSync(ticketsPath, 'utf8'));
    if (!data.tickets || !Array.isArray(data.tickets)) {
      console.log('✗ tickets: missing tickets array');
      failures.push('tickets.json missing tickets array');
    } else {
      console.log(`✓ tickets: ${data.tickets.length} tickets`);
    }
  } catch {
    console.log('✗ tickets: invalid JSON');
    failures.push('tickets.json invalid JSON');
  }
}

// ── Summary ──

console.log('');
if (failures.length === 0) {
  console.log('All checks passed.');
  process.exit(0);
} else {
  console.log(`${failures.length} check(s) failed.`);
  process.exit(1);
}
