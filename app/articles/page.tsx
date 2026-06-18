import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { writeArticleToDisk } from '@/lib/build';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

async function deleteAction(formData: FormData) {
  'use server';
  const id = Number(formData.get('id'));
  if (!id) return;
  const db = getDb();
  const a = db.prepare('SELECT * FROM articles WHERE id = ?').get(id) as any;
  if (a) {
    db.prepare('DELETE FROM articles WHERE id = ?').run(id);
    const { removeArticleDir } = await import('@/lib/build');
    removeArticleDir(a);
  }
  revalidatePath('/articles');
}

async function publishAction(formData: FormData) {
  'use server';
  const id = Number(formData.get('id'));
  if (!id) return;
  const db = getDb();
  const a = db.prepare('SELECT * FROM articles WHERE id = ?').get(id) as any;
  if (a) {
    const now = Math.floor(Date.now() / 1000);
    db.prepare(`UPDATE articles SET status='published', published_at=COALESCE(published_at, ?), updated_at=? WHERE id=?`).run(now, now, id);
    const fresh = db.prepare('SELECT * FROM articles WHERE id = ?').get(id) as any;
    writeArticleToDisk(fresh);
  }
  revalidatePath('/articles');
  revalidatePath('/');
}

export default async function ArticlesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const session = await getSession();
  if (!session) redirect('/login');
  const { q = '', status = '' } = await searchParams;
  const db = getDb();
  const where: string[] = []; const params: any[] = [];
  if (q) { where.push('(domain LIKE ? OR title LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
  if (status) { where.push('status = ?'); params.push(status); }
  const sql = `SELECT id, domain, title, status, updated_at FROM articles ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY updated_at DESC LIMIT 500`;
  const rows = db.prepare(sql).all(...params) as any[];

  return (
    <div className="min-h-screen">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-semibold">Article Panel</h1>
            <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">Dashboard</Link>
            <Link href="/articles" className="text-sm text-slate-900 font-medium">Articles</Link>
            <Link href="/articles/new" className="text-sm text-blue-600 hover:text-blue-800">+ New</Link>
            <Link href="/deploy" className="text-sm text-slate-600 hover:text-slate-900">Deploy</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <form className="flex gap-2 mb-6">
          <input name="q" defaultValue={q} placeholder="Search domain or title…" className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm" />
          <select name="status" defaultValue={status} className="border border-slate-300 rounded px-3 py-2 text-sm">
            <option value="">All status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          <button className="bg-slate-900 text-white px-4 py-2 rounded text-sm">Filter</button>
        </form>

        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-5 py-2 font-medium">Domain</th>
                <th className="px-5 py-2 font-medium">Title</th>
                <th className="px-5 py-2 font-medium">Status</th>
                <th className="px-5 py-2 font-medium">Updated</th>
                <th className="px-5 py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400">No results.</td></tr>
              )}
              {rows.map(r => (
                <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-5 py-2 font-mono text-xs"><Link href={`/articles/${r.id}`} className="text-blue-600 hover:underline">{r.domain}</Link></td>
                  <td className="px-5 py-2">{r.title}</td>
                  <td className="px-5 py-2"><span className={`px-2 py-0.5 rounded text-xs font-medium ${r.status === 'published' ? 'bg-green-100 text-green-700' : r.status === 'draft' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{r.status}</span></td>
                  <td className="px-5 py-2 text-slate-500">{new Date(r.updated_at * 1000).toLocaleString()}</td>
                  <td className="px-5 py-2 text-right space-x-2">
                    {r.status !== 'published' && (
                      <form action={publishAction} className="inline">
                        <input type="hidden" name="id" value={r.id} />
                        <button className="text-xs text-green-700 hover:underline">Publish</button>
                      </form>
                    )}
                    <Link href={`/articles/${r.id}`} className="text-xs text-blue-600 hover:underline">Edit</Link>
                    <form action={deleteAction} className="inline">
                      <input type="hidden" name="id" value={r.id} />
                      <button className="text-xs text-red-600 hover:underline" onClick={(e) => { if (!confirm('Delete?')) e.preventDefault(); }}>Delete</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
