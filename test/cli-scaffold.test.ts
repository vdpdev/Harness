import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { execFileSync } from 'node:child_process';
import { withTempDir } from './helpers/temp-dir.js';

const ROOT = path.resolve('.');
const BIN = path.resolve('bin/index.js');
const TEMP_DIR_LABEL = 'scaffold-test';
const SCAFFOLD_APP = 'my-app';
const COOL_PROJECT = 'cool-project';
const PKG_FILE = 'package.json';

const run = (args: string[], dir: string) => {
  try {
    const stdout = execFileSync('node', [BIN, ...args], {
      encoding: 'utf8',
      cwd: dir,
      timeout: 10000,
    });
    return { stdout, stderr: '', code: 0 };
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; status?: number };
    return { stdout: e.stdout ?? '', stderr: e.stderr ?? '', code: e.status ?? 1 };
  }
};

describe('CLI scaffold (bin/index.js)', () => {
  it('creates a project directory with expected files', () => {
    withTempDir(TEMP_DIR_LABEL, (dir) => {
      const result = run([SCAFFOLD_APP], dir);
      assert.equal(result.code, 0, `CLI failed: ${result.stderr}`);

      const projectDir = path.join(dir, SCAFFOLD_APP);
      assert.ok(fs.existsSync(projectDir), 'project directory created');
      assert.ok(fs.existsSync(path.join(projectDir, PKG_FILE)), 'package.json exists');
      assert.ok(fs.existsSync(path.join(projectDir, 'README.md')), 'README.md exists');
      assert.ok(fs.existsSync(path.join(projectDir, 'src')), 'src/ exists');
      assert.ok(fs.existsSync(path.join(projectDir, 'test')), 'test/ exists');
      assert.ok(fs.existsSync(path.join(projectDir, 'AGENTS.md')), 'AGENTS.md exists');
    });
  });

  it('sets package name and private flag', () => {
    withTempDir(TEMP_DIR_LABEL, (dir) => {
      run([COOL_PROJECT], dir);

      const pkg = JSON.parse(fs.readFileSync(path.join(dir, COOL_PROJECT, PKG_FILE), 'utf8'));
      assert.equal(pkg.name, COOL_PROJECT);
      assert.equal(pkg.private, true);
    });
  });

  it('removes bin and files fields from scaffolded package', () => {
    withTempDir(TEMP_DIR_LABEL, (dir) => {
      run([SCAFFOLD_APP], dir);

      const pkg = JSON.parse(fs.readFileSync(path.join(dir, SCAFFOLD_APP, PKG_FILE), 'utf8'));
      assert.equal(pkg.bin, undefined, 'bin field removed');
      assert.equal(pkg.files, undefined, 'files field removed');
    });
  });

  it('resets tickets.json in scaffolded project', () => {
    withTempDir(TEMP_DIR_LABEL, (dir) => {
      run([SCAFFOLD_APP], dir);

      const ticketsPath = path.join(dir, SCAFFOLD_APP, 'tickets.json');
      if (fs.existsSync(ticketsPath)) {
        const tickets = JSON.parse(fs.readFileSync(ticketsPath, 'utf8'));
        assert.deepEqual(tickets.tickets, [], 'tickets array is empty');
        assert.equal(tickets.meta.nextId, 1, 'nextId reset to 1');
      }
    });
  });

  it('exits with error when no project name given', () => {
    const result = run([], ROOT);
    assert.notEqual(result.code, 0, 'exits non-zero');
    assert.ok(result.stderr.includes('Usage'), 'shows usage message');
  });

  it('rejects path traversal in project name', () => {
    withTempDir(TEMP_DIR_LABEL, (dir) => {
      const result = run(['../escape'], dir);
      assert.notEqual(result.code, 0, 'exits non-zero for path traversal');
    });
  });

  it('rejects names with special characters', () => {
    withTempDir(TEMP_DIR_LABEL, (dir) => {
      const result = run(['my app!'], dir);
      assert.notEqual(result.code, 0, 'exits non-zero for invalid name');
    });
  });

  it('rejects non-empty existing directory', () => {
    withTempDir(TEMP_DIR_LABEL, (dir) => {
      fs.mkdirSync(path.join(dir, 'existing'));
      fs.writeFileSync(path.join(dir, 'existing', 'file.txt'), 'hello');

      const result = run(['existing'], dir);
      assert.notEqual(result.code, 0, 'exits non-zero for non-empty dir');
    });
  });

  it('allows scaffolding into empty existing directory', () => {
    withTempDir(TEMP_DIR_LABEL, (dir) => {
      fs.mkdirSync(path.join(dir, 'empty-dir'));

      const result = run(['empty-dir'], dir);
      assert.equal(result.code, 0, `succeeds for empty dir: ${result.stderr}`);
    });
  });

  it('does not copy excluded directories', () => {
    withTempDir(TEMP_DIR_LABEL, (dir) => {
      run([SCAFFOLD_APP], dir);

      const projectDir = path.join(dir, SCAFFOLD_APP);
      assert.ok(!fs.existsSync(path.join(projectDir, 'node_modules')), 'no node_modules');
      assert.ok(!fs.existsSync(path.join(projectDir, 'dist')), 'no dist');
      assert.ok(!fs.existsSync(path.join(projectDir, 'bin')), 'no bin');
      assert.ok(!fs.existsSync(path.join(projectDir, '.tmp')), 'no .tmp');
    });
  });
});
