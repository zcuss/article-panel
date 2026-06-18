import { NextResponse } from 'next/server';
import { getDb, type Article } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { writeArticleToDisk, removeArticleDir } from '@/lib/build';

export async function POST() {
  try { await requireAdmin(); } catch (r) { return r as Response; }
  const db = getDb();
  const published = db.prepare("SELECT * FROM articles WHERE status='published'").all() as Article[];
  const all = db.prepare("SELECT * FROM articles").all() as Article[];
  let written = 0;
  for (const a of published) { writeArticleToDisk(a); written++; }
  // remove dirs for non-published
  for (const a of all) {
    if (a.status !== 'published') removeArticleDir(a);
  }
  return NextResponse.json({ written, total_published: published.length });
}
