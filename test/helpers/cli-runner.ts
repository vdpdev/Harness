import { execFileSync } from 'node:child_process';

export interface RunResult {
  stdout: string;
  stderr: string;
  code: number;
}

export interface RunOptions {
  timeout?: number;
  env?: NodeJS.ProcessEnv;
  cwd?: string;
}

export const runScript = (scriptPath: string, args: string[], options?: RunOptions): RunResult => {
  try {
    const result = execFileSync('node', ['--import', 'tsx', scriptPath, ...args], {
      encoding: 'utf8',
      cwd: options?.cwd ?? process.cwd(),
      env: options?.env,
      timeout: options?.timeout ?? 20000,
    });
    return { stdout: result, stderr: '', code: 0 };
  } catch (err: unknown) {
    const execErr = err as { stdout?: string; stderr?: string; status?: number };
    return { stdout: execErr.stdout ?? '', stderr: execErr.stderr ?? '', code: execErr.status ?? 1 };
  }
};
