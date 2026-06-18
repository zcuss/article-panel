import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { sudo } from '@/lib/sh';

export async function POST() {
  try { await requireAdmin(); } catch (r) { return r as Response; }
  const r = await sudo('nginx', ['-t']);
  return NextResponse.json({ ok: r.code === 0, code: r.code, stdout: r.stdout, stderr: r.stderr });
}