'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const FIELDS: Array<{ key: string; label: string; type: 'text' | 'password' | 'url'; help?: string }> = [
  { key: 'ADMIN_PASSWORD', label: 'Admin password', type: 'password', help: 'Restart required after change.' },
  { key: 'JWT_SECRET', label: 'JWT secret (32+ chars)', type: 'password', help: 'Restart required after change.' },
  { key: 'AI_BASE_URL', label: 'AI base URL', type: 'url', help: 'OpenAI-compatible endpoint, e.g. https://api.openai.com/v1' },
  { key: 'AI_API_KEY', label: 'AI API key', type: 'password', help: 'Stored on disk only. Leave blank to keep current.' },
  { key: 'AI_MODEL', label: 'AI model', type: 'text', help: 'e.g. gpt-4o-mini, gpt-4o, claude-3-5-sonnet' },
  { key: 'AI_EXTRA_HEADER', label: 'AI extra header (optional)', type: 'text', help: 'Format: "Header-Name: value". Used for OpenRouter/Together.' },
  { key: 'SITES_DIR', label: 'Sites directory', type: 'text' },
  { key: 'NGINX_SITES_DIR', label: 'Nginx sites directory', type: 'text' },
  { key: 'NGINX_INCLUDE_PATH', label: 'Nginx include file', type: 'text' },
  { key: 'NGINX_RELOAD_CMD', label: 'Nginx reload command', type: 'text' },
];

export default function SettingsForm({ initial }: { initial: Record<string, string> }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [status, setStatus] = useState<{ kind: 'idle' | 'ok' | 'err'; msg?: string; restart?: boolean }>({ kind: 'idle' });
  const [pending, start] = useTransition();

  function set(k: string, v: string) {
    setValues((p) => ({ ...p, [k]: v }));
  }

  function save() {
    setStatus({ kind: 'idle' });
    start(async () => {
      // Don't send masked API key
      const payload: Record<string, string> = {};
      for (const [k, v] of Object.entries(values)) {
        if (k === 'AI_API_KEY' && v.includes('…')) continue;
        if (k === 'JWT_SECRET' && v === initial.JWT_SECRET) continue;
        if (k === 'ADMIN_PASSWORD' && v === initial.ADMIN_PASSWORD) continue;
        payload[k] = v;
      }
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ kind: 'err', msg: data.error || 'Save failed' });
        return;
      }
      setStatus({ kind: 'ok', msg: 'Saved.', restart: data.restartRequired });
      router.refresh();
    });
  }

  return (
    <>
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-semibold">Settings</h1>
            <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">Dashboard</Link>
            <Link href="/articles" className="text-sm text-slate-600 hover:text-slate-900">Articles</Link>
            <Link href="/articles/new" className="text-sm text-blue-600 hover:text-blue-800">+ New</Link>
            <Link href="/deploy" className="text-sm text-slate-600 hover:text-slate-900">Deploy</Link>
            <Link href="/system" className="text-sm text-slate-600 hover:text-slate-900">System</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-5">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{f.label}</label>
              <input
                type={f.type}
                value={values[f.key] ?? ''}
                onChange={(e) => set(f.key, e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded font-mono text-sm focus:outline-none focus:border-blue-500"
                autoComplete="off"
                spellCheck={false}
              />
              {f.help && <p className="text-xs text-slate-500 mt-1">{f.help}</p>}
            </div>
          ))}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={save}
              disabled={pending}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {pending ? 'Saving…' : 'Save'}
            </button>
            {status.kind === 'ok' && (
              <span className="text-sm text-green-700">
                ✅ {status.msg}
                {status.restart && ' Restart the app for auth changes to take effect.'}
              </span>
            )}
            {status.kind === 'err' && (
              <span className="text-sm text-red-700">❌ {status.msg}</span>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
