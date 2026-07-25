import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

export const idFor = (relPath) => relPath.split(path.sep).join('/');
