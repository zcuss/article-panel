import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { readEnv, writeEnv, EDITABLE_KEYS } from '@/lib/env';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const all = readEnv();
  const out: Record<string, string> = {};
  for (const k of EDITABLE_KEYS) {
    out[k] = all[k] ?? '';
  }
  // Mask API key on read
  if (out.AI_API_KEY) {
    const k = out.AI_API_KEY;
    out.AI_API_KEY = k.length > 8 ? `${k.slice(0, 4)}…${k.slice(-4)}` : '••••';
  }
  return NextResponse.json({ settings: out });
}

const Body = z.object({
  values: z.record(z.string(), z.string()),
});

export async function PUT(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid body' }, { status: 400 });

  const filtered: Record<string, string> = {};
  for (const [k, v] of Object.entries(parsed.data.values)) {
    if ((EDITABLE_KEYS as readonly string[]).includes(k)) filtered[k] = v;
  }
  const merged = writeEnv(filtered);

  // Note: AI_* picks up next call. JWT_SECRET/ADMIN_PASSWORD require restart.
  return NextResponse.json({
    ok: true,
    restartRequired:
      'ADMIN_PASSWORD' in filtered || 'JWT_SECRET' in filtered,
    saved: Object.keys(filtered),
    settings: Object.fromEntries(
      EDITABLE_KEYS.map((k) => [k, merged[k] ?? ''])
    ),
  });
}
