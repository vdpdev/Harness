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
import { ExtractedFunction, SplitPlan, subdir } from '../split-functions.js';

export function generateExtractedFile(plan: SplitPlan, func: ExtractedFunction, subdir: boolean): string {
  const lines: string[] = [];

  // 1. External imports (copied from original file)
  for (const imp of plan.importTexts) {
    lines.push(imp);
  }

  // 2. Import names defined in the barrel that this function references
  const barrelImports: string[] = [];
  for (const name of plan.definedNames) {
    if (name === func.name) continue; // don't import self
    if (func.fullText.includes(name)) {
      barrelImports.push(name);
    }
  }
  if (barrelImports.length > 0) {
    barrelImports.sort();
    const barrelPath = subdir ? `../${plan.barrelName}` : `./${plan.barrelName}`;
    lines.push(`import { ${barrelImports.join(', ')} } from '${barrelPath}';`);
  }

  // 3. Import sibling functions
  for (const dep of func.deps) {
    lines.push(`import { ${dep} } from './${kebabCase(dep)}.js';`);
  }

  // 4. Blank line + the function (always exported in extracted file)
  lines.push('');
  if (func.isExported) {
    lines.push(func.fullText);
  } else {
    // Prepend `export` keyword to the statement
    const text = func.fullText;
    if (/^(const |let |var |function )/i.test(text)) {
      lines.push('export ' + text);
    } else {
      lines.push(text);
    }
  }

  return lines.join('\n') + '\n';
}
