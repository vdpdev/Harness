import * as fs from 'node:fs';
import * as path from 'node:path';
import * as childProcess from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { canTransition, formatStateModel, formatStateTransitions } from '../utils/stateModel.ts';
import { TEST_FILE_PATTERNS } from '../test-coverage.js';

export const isTestFile = (name) => TEST_FILE_PATTERNS.some((re) => re.test(name));
