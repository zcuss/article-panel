import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession, clearSessionCookie } from '@/lib/auth';

async function logout() {
  'use server';
  await clearSessionCookie();
  redirect('/login');
}

export default async function SystemPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-semibold">Article Panel</h1>
            <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">Dashboard</Link>
            <Link href="/articles" className="text-sm text-slate-600 hover:text-slate-900">Articles</Link>
            <Link href="/deploy" className="text-sm text-slate-600 hover:text-slate-900">Deploy</Link>
            <Link href="/system" className="text-sm text-blue-600 font-semibold">System</Link>
          </div>
          <form action={logout}>
            <button className="text-sm text-slate-500 hover:text-red-600">Logout</button>
          </form>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold mb-6">System</h2>
        <SystemClient />
      </main>
    </div>
  );
}