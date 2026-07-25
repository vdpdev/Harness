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

export function extractFunctionNames(stmt: Statement): string[] {
  const names: string[] = [];
  if (Node.isFunctionDeclaration(stmt)) {
    const name = stmt.getName();
    if (name) names.push(name);
    return names;
  }
  if (Node.isVariableStatement(stmt)) {
    for (const decl of stmt.getDeclarationList().getDeclarations()) {
      const init = decl.getInitializer();
      if (init && (Node.isArrowFunction(init) || Node.isFunctionExpression(init))) {
        const name = decl.getName();
        if (name) names.push(name);
      }
    }
  }
  return names;
}
