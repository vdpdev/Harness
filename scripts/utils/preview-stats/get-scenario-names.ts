import * as fs from 'node:fs';
import * as path from 'node:path';

export const getScenarioNames = (rootDir: string): string[] => {
  if (!fs.existsSync(rootDir)) return [];
  return fs
    .readdirSync(rootDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
};
