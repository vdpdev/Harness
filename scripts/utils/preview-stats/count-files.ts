import * as fs from 'node:fs';
import * as path from 'node:path';
import { walkTxt } from './walk-txt.js';

export const countFiles = (dir: string): number => walkTxt(dir).length;
