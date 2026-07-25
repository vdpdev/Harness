import * as ts from 'typescript';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '..', '..');
export interface TestHealthResult {
  ok: boolean;
  sourceFilesChecked: number;
  exportedSymbolsChecked: number;
  missingTestFiles: string[];
  missingSymbolReferences: Array<{ symbol: string; source: string; test: string }>;
}

// Extracted functions (single-responsibility modules)
export { isSourceFile } from './check-test-health/is-source-file.js';
export { findSourceFiles } from './check-test-health/find-source-files.js';
export { findTestFile } from './check-test-health/find-test-file.js';
export { extractExportedSymbols } from './check-test-health/extract-exported-symbols.js';
export { isSymbolReferenced } from './check-test-health/is-symbol-referenced.js';
export { check } from './check-test-health/check.js';
