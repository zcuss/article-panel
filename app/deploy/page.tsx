import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import DeployPanel from './DeployPanel';

export const dynamic = 'force-dynamic';

export default async function DeployPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  const db = getDb();
  const counts = db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN status='published' THEN 1 ELSE 0 END) AS published
    FROM articles
  `).get() as { total: number; published: number };
  const sample = db.prepare(`SELECT domain, title, status FROM articles WHERE status='published' ORDER BY domain LIMIT 5`).all() as any[];

  return (
    <div className="min-h-screen">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-6">
          <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">← Dashboard</Link>
          <h1 className="text-lg font-semibold">Deploy</h1>
          <Link href="/system" className="text-sm text-slate-600 hover:text-slate-900 ml-auto">System</Link>
        </div>
      </nav>
      <main className="max-w-3xl mx-auto px-6 py-8">
        <DeployPanel counts={counts} sample={sample} />
      </main>
    </div>
  );
}
