import * as ts from 'typescript';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

export const isSymbolReferenced = (symbol: string, testContent: string): boolean => {
  // Check for the symbol name in imports, describe blocks, or direct usage
  const patterns = [
    new RegExp(`\\b${symbol}\\b`),
    new RegExp(`import\\s+\\{[^}]*\\b${symbol}\\b[^}]*\\}`),
    new RegExp(`import\\s+\\b${symbol}\\b`),
    new RegExp(`describe\\s*\\(\\s*['"\`]${symbol}['"\`]`),
  ];
  return patterns.some((p) => p.test(testContent));
};
