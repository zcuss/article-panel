import { NextRequest, NextResponse } from 'next/server';
import { getDb, type Article } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { articleInput } from '@/lib/validators';
import { writeArticleToDisk } from '@/lib/build';

export async function GET() {
  try { await requireAdmin(); } catch (r) { return r as Response; }
  const db = getDb();
  const rows = db.prepare('SELECT * FROM articles ORDER BY updated_at DESC LIMIT 500').all();
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  try { await requireAdmin(); } catch (r) { return r as Response; }
  const body = await req.json().catch(() => null);
  const parsed = articleInput.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'validation', issues: parsed.error.issues }, { status: 400 });

  const a = parsed.data;
  const now = Math.floor(Date.now() / 1000);
  const db = getDb();
  const exists = db.prepare('SELECT id FROM articles WHERE domain = ?').get(a.domain);
  if (exists) return NextResponse.json({ error: 'domain already exists' }, { status: 409 });

  const stmt = db.prepare(`
    INSERT INTO articles (domain, title, header, topic, keywords, meta_description, og_image,
      body_html, body_markdown, lang, status, published_at, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);
  const info = stmt.run(
    a.domain, a.title, a.header, a.topic || null, a.keywords || null, a.meta_description || null, a.og_image || null,
    a.body_html || '', a.body_markdown || null, a.lang, a.status,
    a.status === 'published' ? now : null, now, now
  );
  const fresh = db.prepare('SELECT * FROM articles WHERE id = ?').get(info.lastInsertRowid) as Article;
  if (fresh.status === 'published') writeArticleToDisk(fresh);
  return NextResponse.json(fresh, { status: 201 });
}
