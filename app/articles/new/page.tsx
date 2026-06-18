import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import ArticleForm from '../ArticleForm';

export const dynamic = 'force-dynamic';

export default async function NewArticlePage() {
  const session = await getSession();
  if (!session) redirect('/login');
  return (
    <div className="min-h-screen">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-6">
          <Link href="/articles" className="text-sm text-slate-600 hover:text-slate-900">← Back</Link>
          <h1 className="text-lg font-semibold">New Article</h1>
        </div>
      </nav>
      <main className="max-w-3xl mx-auto px-6 py-8">
        <ArticleForm mode="create" />
      </main>
    </div>
  );
}
