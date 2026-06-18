import Link from 'next/link';
import { getDb } from '@/lib/db';
import { getSession, clearSessionCookie } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function logout() {
  'use server';
  await clearSessionCookie();
  redirect('/login');
}

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const db = getDb();
  const rows = db.prepare(`
    SELECT id, domain, title, status, updated_at
    FROM articles
    ORDER BY updated_at DESC
    LIMIT 50
  `).all() as Array<{ id: number; domain: string; title: string; status: string; updated_at: number }>;

  const counts = db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN status='published' THEN 1 ELSE 0 END) AS published,
      SUM(CASE WHEN status='draft' THEN 1 ELSE 0 END) AS draft
    FROM articles
  `).get() as { total: number; published: number; draft: number };

  return (
    <div className="min-h-screen">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-semibold">Article Panel</h1>
            <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">Dashboard</Link>
            <Link href="/articles" className="text-sm text-slate-600 hover:text-slate-900">Articles</Link>
            <Link href="/articles/new" className="text-sm text-blue-600 hover:text-blue-800">+ New</Link>
            <Link href="/deploy" className="text-sm text-slate-600 hover:text-slate-900">Deploy</Link>
            <Link href="/system" className="text-sm text-slate-600 hover:text-slate-900">System</Link>
          </div>
          <form action={logout}>
            <button className="text-sm text-slate-500 hover:text-red-600">Logout</button>
          </form>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Stat label="Total" value={counts.total || 0} />
          <Stat label="Published" value={counts.published || 0} />
          <Stat label="Draft" value={counts.draft || 0} />
        </div>

        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-semibold">Recent</h2>
            <Link href="/articles" className="text-sm text-blue-600">View all →</Link>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-5 py-2 font-medium">Domain</th>
                <th className="px-5 py-2 font-medium">Title</th>
                <th className="px-5 py-2 font-medium">Status</th>
                <th className="px-5 py-2 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-400">No articles yet. <Link href="/articles/new" className="text-blue-600">Create one →</Link></td></tr>
              )}
              {rows.map(r => (
                <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-5 py-2 font-mono text-xs"><Link href={`/articles/${r.id}`} className="text-blue-600 hover:underline">{r.domain}</Link></td>
                  <td className="px-5 py-2">{r.title}</td>
                  <td className="px-5 py-2"><StatusBadge status={r.status} /></td>
                  <td className="px-5 py-2 text-slate-500">{new Date(r.updated_at * 1000).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5">
      <div className="text-3xl font-semibold">{value}</div>
      <div className="text-sm text-slate-500 mt-1">{label}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    published: 'bg-green-100 text-green-700',
    draft: 'bg-amber-100 text-amber-700',
    archived: 'bg-slate-100 text-slate-600',
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[status] || 'bg-slate-100 text-slate-600'}`}>{status}</span>;
}
