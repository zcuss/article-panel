"use strict";(()=>{var e={};e.id=977,e.ids=[977],e.modules={2934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2254:e=>{e.exports=require("node:buffer")},6005:e=>{e.exports=require("node:crypto")},7561:e=>{e.exports=require("node:fs")},9411:e=>{e.exports=require("node:path")},7261:e=>{e.exports=require("node:util")},6357:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>b,patchFetch:()=>T,requestAsyncStorage:()=>x,routeModule:()=>h,serverHooks:()=>f,staticGenerationAsyncStorage:()=>E});var a={};r.r(a),r.d(a,{DELETE:()=>g,GET:()=>m,PATCH:()=>u});var i=r(3278),n=r(5002),o=r(4877),s=r(1309),l=r(3350),d=r(6910),c=r(1304),p=r(3821);async function m(e,{params:t}){try{await (0,d.kF)()}catch(e){return e}let{id:r}=await t,a=(0,l.z)().prepare("SELECT * FROM articles WHERE id = ?").get(Number(r));return a?s.NextResponse.json(a):s.NextResponse.json({error:"not found"},{status:404})}async function u(e,{params:t}){try{await (0,d.kF)()}catch(e){return e}let{id:r}=await t,a=await e.json().catch(()=>null),i=c.fH.safeParse(a);if(!i.success)return s.NextResponse.json({error:"validation",issues:i.error.issues},{status:400});let n=(0,l.z)(),o=n.prepare("SELECT * FROM articles WHERE id = ?").get(Number(r));if(!o)return s.NextResponse.json({error:"not found"},{status:404});let m={...o,...i.data},u=Math.floor(Date.now()/1e3);n.prepare(`
    UPDATE articles SET
      domain=?, title=?, header=?, topic=?, keywords=?, meta_description=?, og_image=?,
      body_html=?, body_markdown=?, lang=?, status=?, updated_at=?,
      published_at=CASE WHEN ?='published' AND published_at IS NULL THEN ? ELSE published_at END
    WHERE id=?
  `).run(m.domain,m.title,m.header,m.topic,m.keywords,m.meta_description,m.og_image,m.body_html,m.body_markdown,m.lang,m.status,u,m.status,u,o.id);let g=n.prepare("SELECT * FROM articles WHERE id = ?").get(o.id);return"published"===g.status?(0,p.g)(g):(0,p.removeArticleDir)(g),s.NextResponse.json(g)}async function g(e,{params:t}){try{await (0,d.kF)()}catch(e){return e}let{id:r}=await t,a=(0,l.z)(),i=a.prepare("SELECT * FROM articles WHERE id = ?").get(Number(r));return i?(a.prepare("DELETE FROM articles WHERE id = ?").run(i.id),(0,p.removeArticleDir)(i),s.NextResponse.json({ok:!0})):s.NextResponse.json({error:"not found"},{status:404})}let h=new i.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/articles/[id]/route",pathname:"/api/articles/[id]",filename:"route",bundlePath:"app/api/articles/[id]/route"},resolvedPagePath:"/home/runner/work/article-panel/article-panel/app/api/articles/[id]/route.ts",nextConfigOutput:"standalone",userland:a}),{requestAsyncStorage:x,staticGenerationAsyncStorage:E,serverHooks:f}=h,b="/api/articles/[id]/route";function T(){return(0,o.patchFetch)({serverHooks:f,staticGenerationAsyncStorage:E})}},6910:(e,t,r)=>{r.d(t,{B3:()=>l,Gg:()=>c,Rf:()=>m,Uj:()=>p,kF:()=>u,oH:()=>g});var a=r(5832),i=r(5903),n=r(2845);let o="ap_session";function s(){let e=process.env.JWT_SECRET||"dev-secret-change-me-please-32chars";return new TextEncoder().encode(e)}async function l(e){return await new a.N(e).setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime("7d").sign(s())}async function d(e){let{payload:t}=await (0,i._)(e,s());return t}async function c(){let e=(0,n.cookies)(),t=e.get(o)?.value;if(!t)return null;try{return await d(t)}catch{return null}}async function p(e){(0,n.cookies)().set(o,e,{httpOnly:!0,sameSite:"lax",secure:!0,path:"/",maxAge:604800})}async function m(){(0,n.cookies)().delete(o)}async function u(){let e=await c();if(!e||"admin"!==e.role)throw new Response("Unauthorized",{status:401});return e}async function g(e){let t=process.env.ADMIN_PASSWORD||"changeme";if(e.length!==t.length)return!1;let r=0;for(let a=0;a<t.length;a++)r|=e.charCodeAt(a)^t.charCodeAt(a);return 0===r}},3821:(e,t,r)=>{r.d(t,{g:()=>c,removeArticleDir:()=>p});var a=r(7561),i=r.n(a),n=r(9411),o=r.n(n);let s={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"},l=e=>String(e??"").replace(/[&<>"']/g,e=>s[e]),d=(e,t)=>`<!DOCTYPE html>
<html lang="${l(e.lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${l(e.title)}</title>
<meta name="description" content="${l(e.meta_description||e.header.slice(0,160))}">
<meta name="keywords" content="${l(e.keywords||"")}">
<meta property="og:title" content="${l(e.title)}">
<meta property="og:description" content="${l(e.meta_description||e.header.slice(0,160))}">
<meta property="og:type" content="article">
<meta property="og:url" content="https://${l(e.domain)}/">
${e.og_image?`<meta property="og:image" content="${l(e.og_image)}">`:""}
<meta name="robots" content="index,follow">
<link rel="canonical" href="https://${l(e.domain)}/">
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
  <h1>${l(e.title)}</h1>
  <p class="lead">${l(e.header)}</p>
</header>
<main>
  <article>
    ${t}
  </article>
</main>
<footer class="site">
  &copy; ${new Date().getFullYear()} ${l(e.domain)}. All rights reserved.
</footer>
</body>
</html>
`;function c(e,t){let r=t||process.env.SITES_DIR||o().join(process.cwd(),"public","sites"),a=o().join(r,e.domain);i().mkdirSync(a,{recursive:!0});let n=o().join(a,"index.html");i().writeFileSync(n,function(e){let t=e.body_html&&e.body_html.trim().length>0?e.body_html:`<p>${l(e.header)}</p>`;return d(e,t)}(e),"utf8");let s=o().relative(process.cwd(),n).replace(/\\/g,"/");return{path:n,relPath:s}}function p(e,t){let r=t||process.env.SITES_DIR||o().join(process.cwd(),"public","sites"),a=o().join(r,e.domain);i().existsSync(a)&&i().rmSync(a,{recursive:!0,force:!0})}},3350:(e,t,r)=>{r.d(t,{z:()=>m});let a=require("better-sqlite3");var i=r.n(a),n=r(9411),o=r.n(n),s=r(7561),l=r.n(s);let d=o().join(process.cwd(),"data");l().existsSync(d)||l().mkdirSync(d,{recursive:!0});let c=o().join(d,"app.db"),p=null;function m(){return p||((p=new(i())(c)).pragma("journal_mode = WAL"),p.pragma("foreign_keys = ON"),p.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      header TEXT NOT NULL,
      topic TEXT,
      keywords TEXT,
      meta_description TEXT,
      og_image TEXT,
      body_html TEXT NOT NULL DEFAULT '',
      body_markdown TEXT,
      lang TEXT DEFAULT 'id',
      status TEXT DEFAULT 'draft',
      published_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
    CREATE INDEX IF NOT EXISTS idx_articles_domain ON articles(domain);
  `)),p}},1304:(e,t,r)=>{r.d(t,{GL:()=>i,Yq:()=>o,fH:()=>n});var a=r(1045);let i=a.z.object({domain:a.z.string().min(3).max(253).regex(/^[a-z0-9.-]+$/i,"invalid domain"),title:a.z.string().min(2).max(200),header:a.z.string().min(2).max(500),topic:a.z.string().max(300).optional().nullable(),keywords:a.z.string().max(300).optional().nullable(),meta_description:a.z.string().max(300).optional().nullable(),og_image:a.z.string().url().max(500).optional().nullable().or(a.z.literal("")),body_html:a.z.string().max(2e5).optional().nullable(),body_markdown:a.z.string().max(2e5).optional().nullable(),lang:a.z.string().min(2).max(8).default("id"),status:a.z.enum(["draft","published","archived"]).default("draft")}),n=i.partial(),o=a.z.object({domain:a.z.string().min(3),title:a.z.string().min(2),header:a.z.string().min(2),topic:a.z.string().max(300).optional(),keywords:a.z.string().max(300).optional(),lang:a.z.string().min(2).max(8).optional()})}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),a=t.X(0,[787,387,833,45],()=>r(6357));module.exports=a})();