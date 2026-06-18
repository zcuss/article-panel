'use client';
import { useState } from 'react';

type Counts = { total: number; published: number };
type Sample = { domain: string; title: string; status: string };

export default function DeployPanel({ counts, sample }: { counts: Counts; sample: Sample[] }) {
  const [building, setBuilding] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState('');

  async function build() {
    setErr(''); setResult(null);
    setBuilding(true);
    try {
      const r = await fetch('/api/deploy/build', { method: 'POST' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Build failed');
      setResult(d);
    } catch (e: any) { setErr(e.message); }
    finally { setBuilding(false); }
  }

  async function reloadNginx() {
    setErr(''); setResult(null);
    setBuilding(true);
    try {
      const r = await fetch('/api/deploy/reload-nginx', { method: 'POST' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Reload failed');
      setResult(d);
    } catch (e: any) { setErr(e.message); }
    finally { setBuilding(false); }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="font-semibold mb-2">Status</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-slate-500">Total articles:</span> <strong>{counts.total}</strong></div>
          <div><span className="text-slate-500">Published:</span> <strong>{counts.published}</strong></div>
        </div>
        {sample.length > 0 && (
          <div className="mt-4 text-xs text-slate-500">
            Sample: {sample.map(s => s.domain).join(', ')} …
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-3">
        <h2 className="font-semibold">1. Build static HTML</h2>
        <p className="text-sm text-slate-600">Tulis semua artikel published ke <code className="bg-slate-100 px-1 rounded">public/sites/&lt;domain&gt;/index.html</code>.</p>
        <button onClick={build} disabled={building} className="bg-slate-900 text-white px-4 py-2 rounded text-sm disabled:opacity-50">
          {building ? 'Working…' : 'Build All'}
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-3">
        <h2 className="font-semibold">2. Generate nginx config + reload</h2>
        <p className="text-sm text-slate-600">
          Generate 1 server block per domain, gabung ke <code className="bg-slate-100 px-1 rounded">nginx/sites/_all.conf</code>, lalu symlink ke <code className="bg-slate-100 px-1 rounded">{process.env.NGINX_INCLUDE_PATH || '/etc/nginx/sites-enabled/articles.conf'}</code> dan reload nginx via sudo.
        </p>
        <button onClick={reloadNginx} disabled={building} className="bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50">
          {building ? 'Working…' : 'Generate + Reload Nginx'}
        </button>
      </div>

      {err && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{err}</div>}
      {result && (
        <pre className="bg-slate-900 text-slate-100 text-xs p-4 rounded overflow-x-auto">{JSON.stringify(result, null, 2)}</pre>
      )}
    </div>
  );
}
