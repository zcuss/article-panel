import { spawn } from 'node:child_process';

export function sudo(cmd: string, args: string[] = []): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise(resolve => {
    const p = spawn('sudo', ['-n', cmd, ...args], { env: process.env });
    let stdout = '', stderr = '';
    p.stdout.on('data', d => stdout += d.toString());
    p.stderr.on('data', d => stderr += d.toString());
    p.on('close', code => resolve({ code: code ?? -1, stdout, stderr }));
    p.on('error', e => resolve({ code: -1, stdout, stderr: e.message }));
  });
}

export function cmd(bin: string, args: string[] = []): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise(resolve => {
    const p = spawn(bin, args, { env: process.env });
    let stdout = '', stderr = '';
    p.stdout.on('data', d => stdout += d.toString());
    p.stderr.on('data', d => stderr += d.toString());
    p.on('close', code => resolve({ code: code ?? -1, stdout, stderr }));
    p.on('error', e => resolve({ code: -1, stdout, stderr: e.message }));
  });
}

export function which(bin: string): boolean {
  try {
    require('node:child_process').execSync(`command -v ${bin}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function isRoot(): boolean {
  return typeof process.getuid === 'function' && process.getuid() === 0;
}