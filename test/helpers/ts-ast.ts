import * as fs from 'node:fs';
import * as ts from 'typescript';

export const readSourceFile = (filePath: string): ts.SourceFile => {
  return ts.createSourceFile(
    filePath,
    fs.readFileSync(filePath, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
};

export const findFunctionRange = (filePath: string, functionName: string): { start: number; end: number } => {
  return findDeclarationRange(filePath, (node) => ts.isFunctionDeclaration(node) && node.name?.text === functionName);
};

export const findDeclarationRange = (
  filePath: string,
  predicate: (node: ts.Node) => boolean,
): { start: number; end: number } => {
  const sourceFile = readSourceFile(filePath);
  let range: { start: number; end: number } | null = null;

  const visit = (node: ts.Node): void => {
    if (!range && predicate(node)) {
      range = { start: node.getStart(sourceFile), end: node.getEnd() };
      return;
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  if (!range) {
    throw new Error('Declaration not found in fixture');
  }
  return range;
};

export const parseCall = (code: string): ts.CallExpression => {
  const sourceFile = ts.createSourceFile('sample.ts', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let found: ts.CallExpression | null = null;
  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && !found) {
      found = node;
      return;
    }
    node.forEachChild(visit);
  };
  sourceFile.forEachChild(visit);
  if (!found) throw new Error(`no call expression found in: ${code}`);
  return found;
};
