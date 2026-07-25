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

export function modifiesFileScopedNames(node: Node, fileScopedNames: Set<string>): boolean {
  let found = false;
  function walk(n: Node) {
    if (found) return;
    // Assignment: foo = expr, foo += expr, etc.
    if (Node.isBinaryExpression(n)) {
      const op = n.getOperatorToken().getKind();
      if (
        op === SyntaxKind.EqualsToken ||
        op === SyntaxKind.PlusEqualsToken ||
        op === SyntaxKind.MinusEqualsToken ||
        op === SyntaxKind.AsteriskEqualsToken ||
        op === SyntaxKind.SlashEqualsToken ||
        op === SyntaxKind.PercentEqualsToken ||
        op === SyntaxKind.AmpersandEqualsToken ||
        op === SyntaxKind.BarEqualsToken
      ) {
        const left = n.getLeft();
        if (Node.isIdentifier(left) && fileScopedNames.has(left.getText())) {
          found = true;
          return;
        }
      }
    }
    // Postfix/prefix: foo++, ++foo, foo--, --foo
    if (Node.isPostfixUnaryExpression(n) || Node.isPrefixUnaryExpression(n)) {
      const operand = n.getOperand();
      if (Node.isIdentifier(operand) && fileScopedNames.has(operand.getText())) {
        found = true;
        return;
      }
    }
    n.forEachChild(walk);
  }
  // For arrow functions, walk the initializer; for function declarations, walk the body
  if (Node.isVariableDeclaration(node)) {
    const init = node.getInitializer();
    if (init) walk(init);
  } else if (Node.isFunctionDeclaration(node)) {
    const body = node.getBody();
    if (body) walk(body);
  } else {
    node.forEachChild(walk);
  }
  return found;
}
