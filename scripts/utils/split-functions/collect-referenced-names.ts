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

export function collectReferencedNames(node: Node, selfName: string): Set<string> {
  const names = new Set<string>();
  function walk(n: Node) {
    if (Node.isIdentifier(n)) {
      const text = n.getText();
      if (text !== selfName) names.add(text);
    }
    n.forEachChild(walk);
  }
  if (Node.isVariableDeclaration(node)) {
    const init = node.getInitializer();
    if (init) walk(init);
  } else if (Node.isFunctionDeclaration(node)) {
    const body = node.getBody();
    if (body) walk(body);
    for (const param of node.getParameters()) walk(param);
    const rtn = node.getReturnTypeNode();
    if (rtn) walk(rtn);
  } else {
    node.forEachChild(walk);
  }
  return names;
}
