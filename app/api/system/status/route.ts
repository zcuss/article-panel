import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { cmd, sudo, which, isRoot } from '@/lib/sh';

export const dynamic = 'force-dynamic';

export async function GET() {
  try { await requireAdmin(); } catch (r) { return r as Response; }

  const [nginxV, nginxT, ufwS, nodeV, kernel] = await Promise.all([
    which('nginx') ? cmd('nginx', ['-v']) : Promise.resolve({ code: -1, stdout: '', stderr: 'not installed' }),
    which('nginx') ? cmd('nginx', ['-t']) : Promise.resolve({ code: -1, stdout: '', stderr: 'not installed' }),
    which('ufw') ? sudo('ufw', ['status']) : Promise.resolve({ code: -1, stdout: '', stderr: 'not installed' }),
    cmd('node', ['-v']),
    cmd('uname', ['-r']),
  ]);

  return NextResponse.json({
    uid: isRoot() ? 0 : 'non-root (uses sudo)',
    node: nodeV.stdout.trim() || nodeV.stderr.trim(),
    kernel: kernel.stdout.trim(),
    nginx: {
      installed: which('nginx'),
      version: nginxV.stderr.match(/nginx\/\S+/)?.[0] || nginxV.stderr.trim() || nginxV.stdout.trim(),
      config_ok: nginxT.code === 0,
    },
    ufw: {
      installed: which('ufw'),
      active: ufwS.stdout.includes('Status: active'),
      raw: ufwS.stdout.trim(),
    },
  });
}