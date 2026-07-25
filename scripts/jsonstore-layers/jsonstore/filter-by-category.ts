import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

export const filterByCategory = (records, category) =>
  category ? records.filter((r) => r.category === category) : records;
