import * as fs from 'node:fs';
import * as path from 'node:path';

export const isTxt = (name: string): boolean => name.endsWith('.txt');
