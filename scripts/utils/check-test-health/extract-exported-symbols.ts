import * as ts from 'typescript';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

export const extractExportedSymbols = (sourceFile: string): string[] => {
  const source = fs.readFileSync(sourceFile, 'utf8');
  const sf = ts.createSourceFile(sourceFile, source, ts.ScriptTarget.Latest, true);

  const symbols: string[] = [];
  ts.forEachChild(sf, (node) => {
    // export function foo()
    if (ts.isFunctionDeclaration(node) && node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
      if (node.name) symbols.push(node.name.text);
    }
    // export const foo = ... / export const foo = function
    if (ts.isVariableStatement(node) && node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
      for (const decl of node.declarationList.declarations) {
        if (ts.isIdentifier(decl.name)) symbols.push(decl.name.text);
      }
    }
    // export class Foo
    if (ts.isClassDeclaration(node) && node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
      if (node.name) symbols.push(node.name.text);
    }
    // export interface Foo / export type Foo / export enum Foo
    if (
      (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node) || ts.isEnumDeclaration(node)) &&
      node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      if (node.name) symbols.push(node.name.text);
    }
    // export default function/class
    if (ts.isExportAssignment(node)) {
      if (node.expression && ts.isIdentifier(node.expression)) {
        symbols.push(node.expression.text);
      }
    }
  });

  return symbols;
};
