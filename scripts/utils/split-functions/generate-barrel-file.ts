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
import { SplitPlan, subdir } from '../split-functions.js';

export function generateBarrelFile(plan: SplitPlan, subdir: boolean): string {
  const lines: string[] = [];

  // Determine which defined names are referenced by ANY extracted function and
  // therefore must be exported from the barrel.
  const needsExport = new Set<string>();
  for (const func of plan.functions) {
    for (const name of plan.definedNames) {
      if (name === func.name) continue;
      if (func.fullText.includes(name)) {
        needsExport.add(name);
      }
    }
  }

  // Determine which extracted function names are referenced by preserved statements.
  // These need to be imported (not just re-exported) so the preserved code can use them.
  const funcNameSet = new Set(plan.functions.map((f) => f.name));
  const neededFuncImports = new Set<string>();
  for (const text of plan.preservedTexts) {
    for (const fname of funcNameSet) {
      if (text.includes(fname)) {
        // Check it's not just the declaration of the name itself
        const declPattern = new RegExp(
          `^(export\\s+)?(const|let|var|type|interface|class|enum|function)\\s+${fname}\\b`,
        );
        if (!declPattern.test(text)) {
          neededFuncImports.add(fname);
        }
      }
    }
  }

  // Keep ALL original imports
  for (const imp of plan.importTexts) {
    lines.push(imp);
  }

  // Import extracted functions that preserved statements reference
  if (neededFuncImports.size > 0) {
    const sorted = [...neededFuncImports].sort();
    for (const fname of sorted) {
      const impPath = subdir ? `./${plan.barrelName}/${kebabCase(fname)}` : `./${kebabCase(fname)}`;
      lines.push(`import { ${fname} } from '${impPath}';`);
    }
  }

  // Keep ALL preserved statements, auto-exporting names that extracted functions need
  if (plan.preservedTexts.length > 0) {
    if (lines.length > 0) lines.push('');
    for (const text of plan.preservedTexts) {
      // Check if this statement defines any name that needs export
      let needsExportModifier = false;
      for (const name of needsExport) {
        const declPattern = new RegExp(
          `^(export\\s+)?(const|let|var|type|interface|class|enum|function)\\s+${name}\\b`,
        );
        if (declPattern.test(text) && !text.startsWith('export ')) {
          needsExportModifier = true;
          break;
        }
      }
      if (needsExportModifier) {
        lines.push('export ' + text);
      } else {
        lines.push(text);
      }
    }
  }

  // Append function re-exports
  if (plan.functions.length > 0) {
    // Check which function names are already re-exported by preserved statements
    const alreadyReexported = new Set<string>();
    for (const text of plan.preservedTexts) {
      for (const func of plan.functions) {
        // Match `export { name }` or `export { name, ... }` or `export { name } from '....js'`
        if (new RegExp(`\\bexport\\s*\\{[^}]*\\b${func.name}\\b[^}]*\\}`).test(text)) {
          alreadyReexported.add(func.name);
        }
      }
    }

    lines.push('');
    lines.push('// Extracted functions (single-responsibility modules)');
    for (const func of plan.functions) {
      if (alreadyReexported.has(func.name)) {
        // Already re-exported by a preserved statement; skip
        continue;
      }
      if (neededFuncImports.has(func.name)) {
        lines.push(`export { ${func.name} };`);
      } else {
        const expPath = subdir ? `./${plan.barrelName}/${kebabCase(func.name)}` : `./${kebabCase(func.name)}`;
        lines.push(`export { ${func.name} } from '${expPath}';`);
      }
    }
  }

  return lines.join('\n') + '\n';
}
