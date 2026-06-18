import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { sudo, which } from '@/lib/sh';

const Req = z.object({
  port: z.union([z.literal(80), z.literal(443), z.number().int().min(1).max(65535)]),
  proto: z.enum(['tcp', 'udp']).default('tcp'),
});

export async function POST(req: Request) {
  try { await requireAdmin(); } catch (r) { return r as Response; }
  if (!which('ufw')) return NextResponse.json({ ok: false, error: 'ufw not installed' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const p = Req.safeParse(body);
  if (!p.success) return NextResponse.json({ ok: false, error: p.error.message }, { status: 400 });

  const r = await sudo('ufw', ['allow', `${p.data.port}/${p.data.proto}`]);
  if (r.code !== 0) return NextResponse.json({ ok: false, stderr: r.stderr }, { status: 500 });
  return NextResponse.json({ ok: true });
}