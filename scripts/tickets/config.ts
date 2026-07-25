import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');

const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));

if (!pkg.ticketPrefix || typeof pkg.ticketPrefix !== 'string') {
  console.error('Missing "ticketPrefix" field in package.json. Set it to your project prefix (e.g. "HAR").');
  process.exit(1);
}

export const TICKET_PREFIX: string = pkg.ticketPrefix;
export const TICKET_ID_RE = new RegExp(`^${TICKET_PREFIX}-\\d+$`);
export const TICKET_ID_FORMAT = `${TICKET_PREFIX}-#`;

export const isValidTicketId = (id: string): boolean => TICKET_ID_RE.test(id);
