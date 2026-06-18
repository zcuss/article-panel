import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const s = await getSession();
  if (s) redirect('/');
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
        <h1 className="text-2xl font-semibold mb-1">Article Panel</h1>
        <p className="text-sm text-slate-500 mb-6">Sign in to continue</p>
        <LoginForm />
      </div>
    </div>
  );
}
