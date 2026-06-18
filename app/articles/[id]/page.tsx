import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import ArticleForm from '../ArticleForm';
import { writeArticleToDisk, removeArticleDir } from '@/lib/build';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

async function saveAction(formData: FormData) {
  'use server';
  const id = Number(formData.get('id'));
  if (!id) return;
  const db = getDb();
  const payload = JSON.parse(String(formData.get('payload') || '{}'));
  const now = Math.floor(Date.now() / 1000);
  db.prepare(`
    UPDATE articles SET
      domain=?, title=?, header=?, topic=?, keywords=?, meta_description=?, og_image=?,
      body_html=?, body_markdown=?, lang=?, status=?, updated_at=?,
      published_at=CASE WHEN ?='published' AND published_at IS NULL THEN ? ELSE published_at END
    WHERE id=?
  `).run(
    payload.domain, payload.title, payload.header, payload.topic || null, payload.keywords || null,
    payload.meta_description || null, payload.og_image || null,
    payload.body_html || '', payload.body_markdown || null, payload.lang || 'id',
    payload.status || 'draft', now, payload.status || 'draft', now, id
  );
  const fresh = db.prepare('SELECT * FROM articles WHERE id = ?').get(id) as any;
  if (fresh && fresh.status === 'published') writeArticleToDisk(fresh);
  else if (fresh) removeArticleDir(fresh);
  revalidatePath('/articles');
  revalidatePath('/');
  revalidatePath(`/articles/${id}`);
  redirect('/articles');
}

async function deleteAction(formData: FormData) {
  'use server';
  const id = Number(formData.get('id'));
  if (!id) return;
  const db = getDb();
  const a = db.prepare('SELECT * FROM articles WHERE id = ?').get(id) as any;
  if (a) {
    db.prepare('DELETE FROM articles WHERE id = ?').run(id);
    removeArticleDir(a);
  }
  revalidatePath('/articles');
  redirect('/articles');
}

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect('/login');
  const { id } = await params;
  const db = getDb();
  const a = db.prepare('SELECT * FROM articles WHERE id = ?').get(Number(id)) as any;
  if (!a) notFound();

  return (
    <div className="min-h-screen">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/articles" className="text-sm text-slate-600 hover:text-slate-900">← Back</Link>
            <h1 className="text-lg font-semibold">Edit · <span className="font-mono text-sm text-slate-500">{a.domain}</span></h1>
          </div>
          <form action={deleteAction} onSubmit={(e) => { if (!confirm('Delete this article?')) e.preventDefault(); }}>
            <input type="hidden" name="id" value={a.id} />
            <button className="text-sm text-red-600 hover:underline">Delete</button>
          </form>
        </div>
      </nav>
      <main className="max-w-3xl mx-auto px-6 py-8">
        <ArticleForm mode="edit" initial={a} serverAction={saveAction} />
      </main>
    </div>
  );
}
