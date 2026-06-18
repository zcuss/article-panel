// OpenAI-compatible chat completion client. Works with OpenAI, OpenRouter, Together, llama.cpp, etc.
export type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string };

export type AIConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
  extraHeader?: string;
};

export function getAIConfig(): AIConfig {
  return {
    baseUrl: (process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, ''),
    apiKey: process.env.AI_API_KEY || '',
    model: process.env.AI_MODEL || 'gpt-4o-mini',
    extraHeader: process.env.AI_EXTRA_HEADER || undefined,
  };
}

export async function chat(messages: ChatMsg[], opts?: { temperature?: number; maxTokens?: number }): Promise<string> {
  const cfg = getAIConfig();
  if (!cfg.apiKey) throw new Error('AI_API_KEY not set');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${cfg.apiKey}`,
  };
  if (cfg.extraHeader) {
    const [k, v] = cfg.extraHeader.split(':').map(s => s.trim());
    if (k && v) headers[k] = v;
  }
  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: cfg.model,
      messages,
      temperature: opts?.temperature ?? 0.7,
      max_tokens: opts?.maxTokens ?? 2048,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`AI ${res.status}: ${t.slice(0, 500)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? '';
}

const SYSTEM = `You are an SEO article writer. Output ONLY valid HTML fragment (no <html>/<body>/<head>). Use semantic tags: <h2>, <h3>, <p>, <ul>, <ol>, <blockquote>, <code>, <pre>. No inline styles. No <script>. 800-1500 words.`;

export async function generateArticle(opts: {
  domain: string;
  title: string;
  header: string;
  topic?: string;
  keywords?: string;
  lang?: string;
}): Promise<{ body_html: string; meta_description: string; keywords: string }> {
  const lang = opts.lang || 'id';
  const userMsg = `Domain: ${opts.domain}
Title: ${opts.title}
Header (intro paragraph shown above the article): ${opts.header}
${opts.topic ? `Topic angle: ${opts.topic}` : ''}
${opts.keywords ? `Target keywords: ${opts.keywords}` : ''}
Language: ${lang}

Return a JSON object with keys:
- body_html: the article HTML
- meta_description: 140-160 char SEO description
- keywords: comma-separated keywords string

Output JSON only, no markdown fences.`;

  const raw = await chat([
    { role: 'system', content: SYSTEM },
    { role: 'user', content: userMsg },
  ], { temperature: 0.8, maxTokens: 3000 });

  const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  let parsed: { body_html: string; meta_description: string; keywords: string };
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    parsed = m ? JSON.parse(m[0]) : { body_html: cleaned, meta_description: '', keywords: '' };
  }
  return parsed;
}
