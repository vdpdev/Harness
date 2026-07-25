import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.ts';

export const isDumpFile = (name) => name.endsWith('.txt');
