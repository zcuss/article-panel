'use client';
import { useEffect, useState } from 'react';

type Status = {
  uid: number | string;
  node: string;
  kernel: string;
  nginx: { installed: boolean; version: string; config_ok: boolean };
  ufw: { installed: boolean; active: boolean; raw: string };
};

type Sites = {
  sites_dir: string;
  nginx_dir: string;
  sites: string[];
  confs: string[];
};

export default function SystemClient() {
  const [status, setStatus] = useState<Status | null>(null);
  const [sites, setSites] = useState<Sites | null>(null);
  const [ufw, setUfw] = useState<any>(null);
  const [log, setLog] = useState<string[]>([]);
  const [domain, setDomain] = useState('');
  const [port, setPort] = useState('80');

  const addLog = (line: string) => setLog(l => [`[${new Date().toLocaleTimeString()}] ${line}`, ...l].slice(0, 20));

  const reload = async () => {
    const [s, si, u] = await Promise.all([
      fetch('/api/system/status').then(r => r.json()),
      fetch('/api/system/sites').then(r => r.json()),
      fetch('/api/system/ufw').then(r => r.json()),
    ]);
    setStatus(s); setSites(si); setUfw(u);
  };

  useEffect(() => { reload(); }, []);

  const action = async (path: string, label: string, body?: any) => {
    addLog(`${label}...`);
    const r = await fetch(path, {
      method: body ? 'POST' : 'POST',
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const j = await r.json().catch(() => ({}));
    addLog(`${label}: ${j.ok ? 'OK' : 'FAIL ' + (j.error || j.stderr || '')}`);
    reload();
  };

  const addSite = () => domain && action(`/api/system/sites/${domain}`, `Add ${domain}`);
  const removeSite = (d: string) => action(`/api/system/sites/${d}`, `Remove ${d}`, {});
  const allowPort = () => action('/api/system/ufw/allow', `Allow ${port}/tcp`, { port: Number(port), proto: 'tcp' });
  const denyPort = () => action('/api/system/ufw/deny', `Deny ${port}/tcp`, { port: Number(port), proto: 'tcp' });

  return (
    <div className="space-y-6">
      {/* Status */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h3 className="font-semibold mb-3">Status</h3>
        {status ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <Box label="UID" value={String(status.uid)} />
            <Box label="Node" value={status.node} />
            <Box label="Kernel" value={status.kernel} />
            <Box label="Nginx" value={status.nginx.installed ? status.nginx.version : 'NOT INSTALLED'} good={status.nginx.installed} />
            <Box label="Nginx config" value={status.nginx.config_ok ? 'OK' : 'BROKEN'} good={status.nginx.config_ok} />
            <Box label="UFW" value={status.ufw.installed ? (status.ufw.active ? 'active' : 'inactive') : 'NOT INSTALLED'} good={status.ufw.installed} />
          </div>
        ) : <p className="text-sm text-slate-500">Loading...</p>}
      </div>

      {/* Nginx */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h3 className="font-semibold mb-3">Nginx</h3>
        <div className="flex flex-wrap gap-2">
          <Btn onClick={() => action('/api/system/nginx/test', 'nginx -t')}>Test config</Btn>
          <Btn onClick={() => action('/api/system/nginx/reload', 'nginx reload')}>Reload</Btn>
        </div>
      </div>

      {/* Sites */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h3 className="font-semibold mb-3">Sites</h3>
        <div className="flex gap-2 mb-3">
          <input value={domain} onChange={e => setDomain(e.target.value)} placeholder="example.com"
            className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm" />
          <Btn onClick={addSite}>Add domain</Btn>
        </div>
        {sites && (
          <>
            <p className="text-xs text-slate-500 mb-2">sites: {sites.sites_dir} · nginx: {sites.nginx_dir}</p>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div>
                <div className="font-medium text-slate-700 mb-1">On disk ({sites.sites.length})</div>
                <ul className="space-y-1">
                  {sites.sites.map(s => (
                    <li key={s} className="flex justify-between bg-slate-50 px-2 py-1 rounded">
                      <span>{s}</span>
                    </li>
                  ))}
                  {!sites.sites.length && <li className="text-slate-400">— none —</li>}
                </ul>
              </div>
              <div>
                <div className="font-medium text-slate-700 mb-1">Nginx configs ({sites.confs.length})</div>
                <ul className="space-y-1">
                  {sites.confs.map(c => (
                    <li key={c} className="flex justify-between items-center bg-slate-50 px-2 py-1 rounded">
                      <span>{c}</span>
                      <button onClick={() => removeSite(c.replace(/\.conf$/, ''))} className="text-xs text-red-600 hover:underline">remove</button>
                    </li>
                  ))}
                  {!sites.confs.length && <li className="text-slate-400">— none —</li>}
                </ul>
              </div>
            </div>
          </>
        )}
      </div>

      {/* UFW */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h3 className="font-semibold mb-3">Firewall (UFW)</h3>
        <div className="flex gap-2 mb-3">
          <input value={port} onChange={e => setPort(e.target.value)} placeholder="port"
            className="w-24 px-3 py-2 border border-slate-300 rounded text-sm" />
          <Btn onClick={allowPort}>Allow</Btn>
          <Btn onClick={denyPort} variant="danger">Deny</Btn>
        </div>
        {ufw && (
          <pre className="bg-slate-900 text-slate-100 text-xs p-3 rounded overflow-x-auto max-h-48">{ufw.raw || '(empty)'}</pre>
        )}
      </div>

      {/* Activity log */}
      {log.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <h3 className="font-semibold mb-3">Activity</h3>
          <ul className="space-y-1 text-xs font-mono">
            {log.map((l, i) => <li key={i} className="text-slate-600">{l}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function Box({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-sm font-medium mt-1 ${good === false ? 'text-red-600' : good === true ? 'text-emerald-600' : ''}`}>{value}</div>
    </div>
  );
}

function Btn({ children, onClick, variant }: { children: React.ReactNode; onClick: () => void; variant?: 'danger' }) {
  const cls = variant === 'danger'
    ? 'px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700'
    : 'px-3 py-2 bg-slate-800 text-white text-sm rounded hover:bg-slate-900';
  return <button onClick={onClick} className={cls}>{children}</button>;
}