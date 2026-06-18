'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

type Initial = {
  id?: number;
  domain: string;
  title: string;
  header: string;
  topic?: string | null;
  keywords?: string | null;
  meta_description?: string | null;
  og_image?: string | null;
  body_html?: string | null;
  body_markdown?: string | null;
  lang?: string;
  status?: 'draft' | 'published' | 'archived';
};

export default function ArticleForm({
  mode,
  initial,
  serverAction,
}: {
  mode: 'create' | 'edit';
  initial?: Initial;
  serverAction?: (fd: FormData) => Promise<void>;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<'ai' | 'manual'>(initial?.body_html ? 'manual' : 'ai');
  const [form, setForm] = useState<Initial>(initial || {
    domain: '', title: '', header: '', topic: '', keywords: '', lang: 'id', status: 'draft',
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, startSaving] = useTransition();
  const [err, setErr] = useState('');
  const [aiMsg, setAiMsg] = useState('');

  function set<K extends keyof Initial>(k: K, v: Initial[K]) { setForm(s => ({ ...s, [k]: v })); }

  async function generateAI() {
    setErr(''); setAiMsg('');
    if (!form.domain || !form.title || !form.header) { setErr('Isi domain, title, header dulu.'); return; }
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: form.domain, title: form.title, header: form.header,
          topic: form.topic, keywords: form.keywords, lang: form.lang,
        }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'AI failed'); }
      const data = await res.json();
      setForm(s => ({
        ...s,
        body_html: data.body_html,
        meta_description: data.meta_description || s.meta_description,
        keywords: data.keywords || s.keywords,
      }));
      setAiMsg(`Generated ${data.body_html.length} chars.`);
      setTab('manual');
    } catch (e: any) { setErr(e.message || 'AI error'); }
    finally { setAiLoading(false); }
  }

  async function submit() {
    setErr('');
    if (mode === 'edit' && serverAction) {
      const fd = new FormData();
      fd.set('id', String(form.id));
      fd.set('payload', JSON.stringify(form));
      startSaving(async () => { await serverAction(fd); });
    } else {
      setAiLoading(true);
      try {
        const res = await fetch('/api/articles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Save failed'); }
        const data = await res.json();
        router.push(`/articles/${data.id}`);
      } catch (e: any) { setErr(e.message || 'Save error'); }
      finally { setAiLoading(false); }
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <h2 className="font-semibold">Identity</h2>
        <Field label="Domain" hint="e.g. ram.web.id (lowercase, no protocol)">
          <input className={inputCls} value={form.domain} onChange={e => set('domain', e.target.value.toLowerCase().trim())} placeholder="ram.web.id" />
        </Field>
        <Field label="Title" hint="Judul artikel (H1)">
          <input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Panduan Memilih RAM untuk Server" />
        </Field>
        <Field label="Header" hint="Lead paragraph pendek di atas artikel">
          <textarea className={inputCls + ' h-20'} value={form.header} onChange={e => set('header', e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Language">
            <select className={inputCls} value={form.lang} onChange={e => set('lang', e.target.value)}>
              <option value="id">id</option>
              <option value="en">en</option>
            </select>
          </Field>
          <Field label="Status">
            <select className={inputCls} value={form.status} onChange={e => set('status', e.target.value as any)}>
              <option value="draft">draft</option>
              <option value="published">published</option>
              <option value="archived">archived</option>
            </select>
          </Field>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="flex border-b border-slate-200">
          <button type="button" onClick={() => setTab('ai')} className={`px-5 py-3 text-sm font-medium ${tab === 'ai' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}>AI Generate</button>
          <button type="button" onClick={() => setTab('manual')} className={`px-5 py-3 text-sm font-medium ${tab === 'manual' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}>Manual</button>
        </div>

        {tab === 'ai' && (
          <div className="p-6 space-y-4">
            <Field label="Topic angle (optional)">
              <input className={inputCls} value={form.topic || ''} onChange={e => set('topic', e.target.value)} placeholder="mis. fokus ke DDR5 vs DDR4" />
            </Field>
            <Field label="Target keywords (optional)">
              <input className={inputCls} value={form.keywords || ''} onChange={e => set('keywords', e.target.value)} placeholder="ram server, ddr5, ddr4" />
            </Field>
            <button
              type="button"
              onClick={generateAI}
              disabled={aiLoading}
              className="bg-blue-600 text-white px-5 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {aiLoading ? 'Generating…' : 'Generate with AI'}
            </button>
            {aiMsg && <div className="text-sm text-green-600">{aiMsg}</div>}
          </div>
        )}

        {tab === 'manual' && (
          <div className="p-6 space-y-4">
            <Field label="Body HTML" hint="Tag HTML semantic, tanpa <script>/inline style">
              <textarea
                className={inputCls + ' h-80 font-mono text-xs'}
                value={form.body_html || ''}
                onChange={e => set('body_html', e.target.value)}
                placeholder="<h2>...</h2><p>...</p>"
              />
            </Field>
            <Field label="Meta description">
              <input className={inputCls} value={form.meta_description || ''} onChange={e => set('meta_description', e.target.value)} />
            </Field>
            <Field label="OG image URL (optional)">
              <input className={inputCls} value={form.og_image || ''} onChange={e => set('og_image', e.target.value)} />
            </Field>
          </div>
        )}
      </div>

      {err && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{err}</div>}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={saving || aiLoading}
          className="bg-slate-900 text-white px-6 py-2 rounded text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
        >
          {saving || aiLoading ? 'Saving…' : mode === 'create' ? 'Create' : 'Save'}
        </button>
        {form.status === 'published' && (
          <span className="text-xs text-slate-500">Published → HTML file akan ditulis ke public/sites/{form.domain}/index.html</span>
        )}
      </div>
    </div>
  );
}

const inputCls = 'w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1">{label}</label>
      {hint && <div className="text-xs text-slate-500 mb-1">{hint}</div>}
      {children}
    </div>
  );
}
