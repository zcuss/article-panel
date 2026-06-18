import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { sudo } from '@/lib/sh';

export async function POST() {
  try { await requireAdmin(); } catch (r) { return r as Response; }
  const r = await sudo('nginx', ['-s', 'reload']);
  if (r.code !== 0) {
    return NextResponse.json({ ok: false, error: 'reload failed', stderr: r.stderr }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}