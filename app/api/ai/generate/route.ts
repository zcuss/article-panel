import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { aiGenerate } from '@/lib/validators';
import { generateArticle } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try { await requireAdmin(); } catch (r) { return r as Response; }
  const body = await req.json().catch(() => null);
  const parsed = aiGenerate.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'validation', issues: parsed.error.issues }, { status: 400 });
  try {
    const out = await generateArticle(parsed.data);
    return NextResponse.json(out);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'AI failed' }, { status: 500 });
  }
}
