import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { sudo, which } from '@/lib/sh';

export const dynamic = 'force-dynamic';

export async function GET() {
  try { await requireAdmin(); } catch (r) { return r as Response; }
  if (!which('ufw')) return NextResponse.json({ installed: false });
  const r = await sudo('ufw', ['status', 'numbered']);
  return NextResponse.json({ installed: true, raw: r.stdout + r.stderr, code: r.code });
}