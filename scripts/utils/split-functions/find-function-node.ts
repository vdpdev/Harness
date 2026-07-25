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

export function findFunctionNode(sourceFile: SourceFile, name: string): Node | undefined {
  for (const stmt of sourceFile.getStatements()) {
    if (Node.isFunctionDeclaration(stmt) && stmt.getName() === name) return stmt;
    if (Node.isVariableStatement(stmt)) {
      for (const decl of stmt.getDeclarationList().getDeclarations()) {
        if (decl.getName() === name) return decl;
      }
    }
  }
  return undefined;
}
