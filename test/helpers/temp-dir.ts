import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

export const createTempDir = (prefix: string, baseDir?: string): string => {
  const base = baseDir ?? os.tmpdir();
  return fs.mkdtempSync(path.join(base, `${prefix}-`));
};

export const removeTempDir = (dir: string): void => {
  fs.rmSync(dir, { recursive: true, force: true });
};

export const withTempDir = <T>(prefix: string, fn: (dir: string) => T, baseDir?: string): T => {
  const dir = createTempDir(prefix, baseDir);
  try {
    return fn(dir);
  } finally {
    removeTempDir(dir);
  }
};
