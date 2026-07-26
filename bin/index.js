#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import childProcess from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXCLUDE = new Set([
  'node_modules',
  '.git',
  'dist',
  'bin',
  'package-lock.json',
  'pnpm-lock.yaml',
  '.tmp',
  '.idea',
  '.agents-custom.md',
]);

const pkgRoot = path.resolve(__dirname, '..');
const projectName = process.argv[2];

if (!projectName) {
  console.error('Usage: npx @vdpdev/harness <project-name>');
  process.exit(1);
}

if (!/^[a-zA-Z0-9._-]+$/.test(projectName) || projectName.startsWith('.') || projectName === '..') {
  console.error(
    `Error: invalid project name "${projectName}". Use only letters, digits, dots, hyphens, and underscores.`,
  );
  process.exit(1);
}

const targetDir = path.resolve(process.cwd(), projectName);

if (!targetDir.startsWith(process.cwd() + path.sep) && targetDir !== process.cwd()) {
  console.error(`Error: project directory must be inside the current working directory.`);
  process.exit(1);
}

if (fs.existsSync(targetDir)) {
  const entries = fs.readdirSync(targetDir).filter((e) => e !== '.git' && e !== '.DS_Store');
  if (entries.length > 0) {
    console.error(`Error: directory "${projectName}" already exists and is not empty.`);
    process.exit(1);
  }
}

function copyDir(src, dest) {
  const name = path.basename(src);
  if (EXCLUDE.has(name)) return;

  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (EXCLUDE.has(entry.name)) continue;
    if (entry.name.startsWith('.husky/_')) continue;

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

fs.mkdirSync(targetDir, { recursive: true });
copyDir(pkgRoot, targetDir);

const pkgPath = path.join(targetDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.name = path.basename(projectName);
pkg.private = true;
delete pkg.bin;
delete pkg.files;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

const ticketsPath = path.join(targetDir, 'tickets.json');
if (fs.existsSync(ticketsPath)) {
  const tickets = JSON.parse(fs.readFileSync(ticketsPath, 'utf8'));
  tickets.meta = { nextId: 1 };
  tickets.tickets = [];
  fs.writeFileSync(ticketsPath, JSON.stringify(tickets, null, 2) + '\n');
}

childProcess.execSync('git init', { cwd: targetDir, stdio: 'ignore' });

console.log(`\n${projectName} created successfully!\n`);
console.log('Next steps:');
console.log(`  cd ${projectName}`);
console.log('  corepack enable');
console.log('  pnpm install');
console.log('  pnpm run repo-health');
console.log('');
