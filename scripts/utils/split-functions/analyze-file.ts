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
import { ExtractedFunction, SplitPlan, minLines } from '../split-functions.js';
import { isFunctionStatement } from './is-function-statement.js';
import { extractFunctionNames } from './extract-function-names.js';
import { findFunctionNode } from './find-function-node.js';
import { collectReferencedNames } from './collect-referenced-names.js';
import { modifiesFileScopedNames } from './modifies-file-scoped-names.js';

export function analyzeFile(sourceFile: SourceFile): SplitPlan | null {
  const filePath = sourceFile.getFilePath();
  const barrelName = path.basename(filePath, '.ts');
  const statements = sourceFile.getStatements();

  const functions: ExtractedFunction[] = [];
  const importTexts: string[] = [];
  const preservedTexts: string[] = [];
  const definedNames = new Set<string>();

  for (const stmt of statements) {
    // Imports → collected separately, copied to extracted files
    if (Node.isImportDeclaration(stmt) || Node.isImportEqualsDeclaration(stmt)) {
      importTexts.push(stmt.getText());
      continue;
    }

    // Functions → candidates for extraction
    if (isFunctionStatement(stmt)) {
      const names = extractFunctionNames(stmt);
      for (const name of names) {
        functions.push({
          name,
          isExported: Node.isFunctionDeclaration(stmt) ? stmt.isExported() : (stmt as VariableStatement).isExported(),
          fullText: stmt.getText(),
          deps: new Set(),
        });
      }
      continue;
    }

    // Everything else → preserved in barrel
    preservedTexts.push(stmt.getText());

    // Track defined names (types, consts, classes, etc.)
    if (Node.isInterfaceDeclaration(stmt)) {
      const name = stmt.getName();
      if (name) definedNames.add(name);
    } else if (Node.isTypeAliasDeclaration(stmt)) {
      const name = stmt.getName();
      if (name) definedNames.add(name);
    } else if (Node.isEnumDeclaration(stmt)) {
      const name = stmt.getName();
      if (name) definedNames.add(name);
    } else if (Node.isClassDeclaration(stmt)) {
      const name = stmt.getName();
      if (name) definedNames.add(name);
    } else if (Node.isVariableStatement(stmt)) {
      for (const decl of stmt.getDeclarationList().getDeclarations()) {
        const name = decl.getName();
        if (name) definedNames.add(name);
      }
    } else if (Node.isExportDeclaration(stmt) && !stmt.getModuleSpecifierValue()) {
      // Local re-export: `export { A, B }`
      for (const el of stmt.getNamedExports()) {
        definedNames.add(el.getName());
      }
    } else if (Node.isExportAssignment(stmt)) {
      definedNames.add('default');
    }
  }

  if (functions.length <= 1) return null;

  // Skip small files — splitting a short file adds barrel overhead for no clarity gain.
  const lineCount = sourceFile.getFullText().split('\n').length;
  if (lineCount < minLines) return null;

  // Compute inter-function dependencies
  const allFuncNames = new Set(functions.map((f) => f.name));
  for (const func of functions) {
    const node = findFunctionNode(sourceFile, func.name);
    if (node) {
      const refs = collectReferencedNames(node, func.name);
      for (const ref of refs) {
        if (allFuncNames.has(ref) && ref !== func.name) func.deps.add(ref);
      }
    }
  }

  // Filter out functions that modify file-scoped mutable state.
  // These cannot be extracted because imported bindings are immutable in ES modules.
  // Add them back as preserved statements so they stay in the barrel.
  const mutatingFunctions: ExtractedFunction[] = [];
  const nonMutatingFunctions = functions.filter((func) => {
    const node = findFunctionNode(sourceFile, func.name);
    if (!node) return true;
    const isMutating = modifiesFileScopedNames(node, definedNames);
    if (isMutating) {
      mutatingFunctions.push(func);
      // Find the original statement text to preserve it
      for (const stmt of sourceFile.getStatements()) {
        if (Node.isFunctionDeclaration(stmt) && stmt.getName() === func.name) {
          preservedTexts.push(stmt.getText());
          break;
        }
        if (Node.isVariableStatement(stmt)) {
          for (const decl of stmt.getDeclarationList().getDeclarations()) {
            if (decl.getName() === func.name) {
              preservedTexts.push(stmt.getText());
              break;
            }
          }
        }
      }
      return false;
    }
    return true;
  });

  if (nonMutatingFunctions.length <= 1) return null;

  return { filePath, barrelName, functions: nonMutatingFunctions, importTexts, preservedTexts, definedNames };
}
