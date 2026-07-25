import * as ts from 'typescript';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT, TestHealthResult } from '../check-test-health.js';
import { findSourceFiles } from './find-source-files.js';
import { findTestFile } from './find-test-file.js';
import { extractExportedSymbols } from './extract-exported-symbols.js';
import { isSymbolReferenced } from './is-symbol-referenced.js';

export const check = (): TestHealthResult => {
  const srcDir = path.join(ROOT, 'src');
  const sourceFiles = findSourceFiles(srcDir);

  const missingTestFiles: string[] = [];
  const missingSymbolReferences: Array<{ symbol: string; source: string; test: string }> = [];
  let exportedSymbolsChecked = 0;

  for (const sourceFile of sourceFiles) {
    const testFile = findTestFile(sourceFile);
    if (!testFile) {
      missingTestFiles.push(path.relative(ROOT, sourceFile));
      continue;
    }

    const symbols = extractExportedSymbols(sourceFile);
    const testContent = fs.readFileSync(testFile, 'utf8');

    for (const symbol of symbols) {
      exportedSymbolsChecked++;
      if (!isSymbolReferenced(symbol, testContent)) {
        missingSymbolReferences.push({
          symbol,
          source: path.relative(ROOT, sourceFile),
          test: path.relative(ROOT, testFile),
        });
      }
    }
  }

  return {
    ok: missingTestFiles.length === 0 && missingSymbolReferences.length === 0,
    sourceFilesChecked: sourceFiles.length,
    exportedSymbolsChecked,
    missingTestFiles,
    missingSymbolReferences,
  };
};
