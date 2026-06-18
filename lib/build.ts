import fs from 'node:fs';
import path from 'node:path';
import type { Article } from './db';

const ESCAPE: Record<string, string> = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
};
const esc = (s: string) => String(s ?? '').replace(/[&<>"']/g, c => ESCAPE[c]);
const escAttr = esc;

const TEMPLATE = (a: Article, body: string) => `<!DOCTYPE html>
<html lang="${escAttr(a.lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(a.title)}</title>
<meta name="description" content="${escAttr(a.meta_description || a.header.slice(0, 160))}">
<meta name="keywords" content="${escAttr(a.keywords || '')}">
<meta property="og:title" content="${escAttr(a.title)}">
<meta property="og:description" content="${escAttr(a.meta_description || a.header.slice(0, 160))}">
<meta property="og:type" content="article">
<meta property="og:url" content="https://${escAttr(a.domain)}/">
${a.og_image ? `<meta property="og:image" content="${escAttr(a.og_image)}">` : ''}
<meta name="robots" content="index,follow">
<link rel="canonical" href="https://${escAttr(a.domain)}/">
<style>
:root{--bg:#fff;--fg:#1a1a1a;--mut:#666;--bd:#e5e5e5;--ac:#2563eb}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;line-height:1.7;color:var(--fg);background:var(--bg);max-width:780px;margin:0 auto;padding:24px 20px 80px}
header.site{border-bottom:1px solid var(--bd);padding-bottom:20px;margin-bottom:32px}
header.site h1{font-size:2rem;line-height:1.25;margin-bottom:12px;letter-spacing:-.02em}
header.site p.lead{color:var(--mut);font-size:1.1rem}
main article h2{font-size:1.5rem;margin:2rem 0 .75rem;letter-spacing:-.01em}
main article h3{font-size:1.2rem;margin:1.5rem 0 .5rem}
main article p{margin-bottom:1rem}
main article ul,main article ol{margin:0 0 1rem 1.5rem}
main article li{margin-bottom:.35rem}
main article blockquote{border-left:3px solid var(--ac);padding:.25rem 1rem;color:var(--mut);margin:1rem 0;background:#f8fafc}
main article code{background:#f1f5f9;padding:2px 6px;border-radius:4px;font-size:.92em}
main article pre{background:#0f172a;color:#e2e8f0;padding:16px;border-radius:8px;overflow-x:auto;margin:1rem 0}
main article pre code{background:transparent;color:inherit;padding:0}
footer.site{margin-top:60px;padding-top:20px;border-top:1px solid var(--bd);color:var(--mut);font-size:.85rem;text-align:center}
@media(max-width:600px){body{padding:16px 14px 60px}header.site h1{font-size:1.5rem}}
</style>
</head>
<body>
<header class="site">
  <h1>${esc(a.title)}</h1>
  <p class="lead">${esc(a.header)}</p>
</header>
<main>
  <article>
    ${body}
  </article>
</main>
<footer class="site">
  &copy; ${new Date().getFullYear()} ${esc(a.domain)}. All rights reserved.
</footer>
</body>
</html>
`;

export function buildArticleHTML(a: Article): string {
  const body = a.body_html && a.body_html.trim().length > 0
    ? a.body_html
    : `<p>${esc(a.header)}</p>`;
  return TEMPLATE(a, body);
}

export function writeArticleToDisk(a: Article, baseDir?: string): { path: string; relPath: string } {
  const base = baseDir || process.env.SITES_DIR || path.join(process.cwd(), 'public', 'sites');
  const dir = path.join(base, a.domain);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'index.html');
  fs.writeFileSync(file, buildArticleHTML(a), 'utf8');
  const relPath = path.relative(process.cwd(), file).replace(/\\/g, '/');
  return { path: file, relPath };
}

export function removeArticleDir(a: Article, baseDir?: string): void {
  const base = baseDir || process.env.SITES_DIR || path.join(process.cwd(), 'public', 'sites');
  const dir = path.join(base, a.domain);
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}
