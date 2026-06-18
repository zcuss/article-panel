import { NextRequest, NextResponse } from 'next/server';
import { getDb, type Article } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { articleUpdate } from '@/lib/validators';
import { writeArticleToDisk, removeArticleDir } from '@/lib/build';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(); } catch (r) { return r as Response; }
  const { id } = await params;
  const db = getDb();
  const a = db.prepare('SELECT * FROM articles WHERE id = ?').get(Number(id)) as Article | undefined;
  if (!a) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(a);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(); } catch (r) { return r as Response; }
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = articleUpdate.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'validation', issues: parsed.error.issues }, { status: 400 });

  const db = getDb();
  const cur = db.prepare('SELECT * FROM articles WHERE id = ?').get(Number(id)) as Article | undefined;
  if (!cur) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const merged = { ...cur, ...parsed.data };
  const now = Math.floor(Date.now() / 1000);
  db.prepare(`
    UPDATE articles SET
      domain=?, title=?, header=?, topic=?, keywords=?, meta_description=?, og_image=?,
      body_html=?, body_markdown=?, lang=?, status=?, updated_at=?,
      published_at=CASE WHEN ?='published' AND published_at IS NULL THEN ? ELSE published_at END
    WHERE id=?
  `).run(
    merged.domain, merged.title, merged.header, merged.topic, merged.keywords, merged.meta_description,
    merged.og_image, merged.body_html, merged.body_markdown, merged.lang, merged.status, now,
    merged.status, now, cur.id
  );
  const fresh = db.prepare('SELECT * FROM articles WHERE id = ?').get(cur.id) as Article;
  if (fresh.status === 'published') writeArticleToDisk(fresh); else removeArticleDir(fresh);
  return NextResponse.json(fresh);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(); } catch (r) { return r as Response; }
  const { id } = await params;
  const db = getDb();
  const a = db.prepare('SELECT * FROM articles WHERE id = ?').get(Number(id)) as Article | undefined;
  if (!a) return NextResponse.json({ error: 'not found' }, { status: 404 });
  db.prepare('DELETE FROM articles WHERE id = ?').run(a.id);
  removeArticleDir(a);
  return NextResponse.json({ ok: true });
}
