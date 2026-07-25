import fs from 'node:fs';
import path from 'node:path';

const checkPackageManager = () => {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.error('package.json not found');
    process.exit(1);
  }

  const content = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const script = content.scripts?.postinstall;

  if (!script || !script.includes('check-package-manager')) {
    console.warn('\n[WARNING] Wrong package manager detected');
    console.warn('This repo is configured to use pnpm (pinned in package.json).');
    console.warn('Re-run with `pnpm install` to avoid lockfile drift.\n');
  }
};

checkPackageManager();
