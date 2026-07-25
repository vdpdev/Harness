import {
  Project,
  Node,
  SyntaxKind,
  type FunctionDeclaration,
  type VariableDeclaration,
  type VariableStatement,
  type SourceFile,
  type Statement,
  type ImportDeclaration,
  type ImportEqualsDeclaration,
} from 'ts-morph';
import kebabCase from 'lodash.kebabcase';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { analyzeFile } from './split-functions/analyze-file.js';
import { generateBarrelFile } from './split-functions/generate-barrel-file.js';
import { generateExtractedFile } from './split-functions/generate-extracted-file.js';

const rawArgs = process.argv.slice(2);
const validate = rawArgs.includes('--validate');
const dryRun = rawArgs.includes('--dry-run') || validate;
export const subdir = rawArgs.includes('--subdir');
const minLinesIdx = rawArgs.indexOf('--min-lines');
export const minLines = minLinesIdx !== -1 ? parseInt(rawArgs[minLinesIdx + 1]!, 10) : 30;
const dirIdx = rawArgs.indexOf('--dir');
const targetDir = path.resolve(dirIdx !== -1 ? rawArgs[dirIdx + 1]! : 'src');
if (!fs.existsSync(targetDir)) {
  console.error(`Directory not found: ${targetDir}`);
  process.exit(1);
}
export interface ExtractedFunction {
  name: string;
  isExported: boolean;
  fullText: string;
  deps: Set<string>;
}
export interface SplitPlan {
  filePath: string;
  barrelName: string;
  functions: ExtractedFunction[];
  /** Text of ALL original import statements (to copy into extracted files). */
  importTexts: string[];
  /** Text of ALL preserved non-function statements (types, consts, classes, re-exports). */
  preservedTexts: string[];
  /** Names defined in the original file (types, consts, etc.) that extracted functions
   *  may need to import back from the barrel. Includes both exported and non-exported. */
  definedNames: Set<string>;
}
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
async function main() {
  const project = new Project({
    tsConfigFilePath: 'tsconfig.json',
    skipAddingFilesFromTsConfig: true,
  });

  project.addSourceFilesAtPaths(path.join(targetDir, '**', '*.ts'));
  const sourceFiles = project.getSourceFiles();

  let splitCount = 0;
  let functionCount = 0;

  console.log(`Scanning ${sourceFiles.length} files in ${targetDir}...`);

  for (const sf of sourceFiles) {
    const plan = analyzeFile(sf);
    if (!plan) continue;

    splitCount++;
    functionCount += plan.functions.length;

    const relPath = path.relative(process.cwd(), plan.filePath);
    console.log(`\n  ${relPath} — ${plan.functions.length} functions:`);
    for (const f of plan.functions) {
      const d = f.deps.size > 0 ? ` (deps: ${[...f.deps].join(', ')})` : '';
      console.log(`    ${f.isExported ? 'export ' : ''}${f.name}${d}`);
    }

    if (dryRun) {
      console.log(`    [dry-run] Would create ${plan.functions.length} files`);
      continue;
    }

    const dir = path.dirname(plan.filePath);
    const outDir = subdir ? path.join(dir, plan.barrelName) : dir;
    if (subdir && !dryRun) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    for (const func of plan.functions) {
      const outPath = path.join(outDir, kebabCase(func.name) + '.ts');
      fs.writeFileSync(outPath, generateExtractedFile(plan, func, subdir), 'utf-8');
      console.log(`    -> ${path.relative(process.cwd(), outPath)}`);
    }

    fs.writeFileSync(plan.filePath, generateBarrelFile(plan, subdir), 'utf-8');
    console.log(`    [barrel] ${relPath}`);
  }

  console.log(`\nDone. ${splitCount} files split, ${functionCount} functions extracted.`);
  if (dryRun) {
    console.log('(dry-run mode — no files were modified)');
    return;
  }

  if (validate && splitCount > 0) {
    console.log('\nValidating with tsc...');
    const { execFileSync } = await import('node:child_process');
    try {
      execFileSync('npx', ['tsc', '--noEmit'], { stdio: 'inherit', cwd: process.cwd() });
      console.log('✓ TypeScript compilation succeeded');
    } catch {
      console.error('✗ TypeScript compilation failed — review the split output');
      process.exit(1);
    }
  }
}

// Extracted functions (single-responsibility modules)
export { isFunctionStatement } from './split-functions/is-function-statement.js';
export { extractFunctionNames } from './split-functions/extract-function-names.js';
export { collectReferencedNames } from './split-functions/collect-referenced-names.js';
export { findFunctionNode } from './split-functions/find-function-node.js';
export { modifiesFileScopedNames } from './split-functions/modifies-file-scoped-names.js';
export { analyzeFile };
export { generateExtractedFile };
export { generateBarrelFile };
