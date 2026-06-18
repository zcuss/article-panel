'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const r = useRouter();
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(''); setLoading(true);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pwd }),
    });
    setLoading(false);
    if (res.ok) r.push('/');
    else { const d = await res.json().catch(() => ({})); setErr(d.error || 'Login failed'); }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="text-sm font-medium block mb-1">Password</label>
        <input
          type="password"
          value={pwd}
          onChange={e => setPwd(e.target.value)}
          className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
          required
        />
      </div>
      {err && <div className="text-sm text-red-600">{err}</div>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-slate-900 text-white py-2 rounded hover:bg-slate-800 disabled:opacity-50"
      >
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
