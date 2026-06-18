(()=>{var e={};e.id=222,e.ids=[222],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},2254:e=>{"use strict";e.exports=require("node:buffer")},6005:e=>{"use strict";e.exports=require("node:crypto")},7561:e=>{"use strict";e.exports=require("node:fs")},9411:e=>{"use strict";e.exports=require("node:path")},7261:e=>{"use strict";e.exports=require("node:util")},9042:(e,t,r)=>{"use strict";r.r(t),r.d(t,{GlobalError:()=>n.a,__next_app__:()=>p,originalPathname:()=>m,pages:()=>c,routeModule:()=>u,tree:()=>d}),r(4955),r(4403),r(996);var a=r(170),i=r(5002),s=r(3876),n=r.n(s),l=r(6299),o={};for(let e in l)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(o[e]=()=>l[e]);r.d(t,o);let d=["",{children:["articles",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(r.bind(r,4955)),"/home/runner/work/article-panel/article-panel/app/articles/page.tsx"]}]},{}]},{layout:[()=>Promise.resolve().then(r.bind(r,4403)),"/home/runner/work/article-panel/article-panel/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(r.t.bind(r,996,23)),"next/dist/client/components/not-found-error"]}],c=["/home/runner/work/article-panel/article-panel/app/articles/page.tsx"],m="/articles/page",p={require:r,loadChunk:()=>Promise.resolve()},u=new a.AppPageRouteModule({definition:{kind:i.x.APP_PAGE,page:"/articles/page",pathname:"/articles",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:d}})},7234:(e,t,r)=>{let a={d73c6027b03fba72c307293251f3c736d7f67307:()=>Promise.resolve().then(r.bind(r,4955)).then(e=>e.$$ACTION_0),fb6733cf50002a534d53e8f73da1bb6ce1a15323:()=>Promise.resolve().then(r.bind(r,4955)).then(e=>e.$$ACTION_1)};async function i(e,...t){return(await a[e]()).apply(null,t)}e.exports={d73c6027b03fba72c307293251f3c736d7f67307:i.bind(null,"d73c6027b03fba72c307293251f3c736d7f67307"),fb6733cf50002a534d53e8f73da1bb6ce1a15323:i.bind(null,"fb6733cf50002a534d53e8f73da1bb6ce1a15323")}},4762:()=>{},2568:(e,t,r)=>{Promise.resolve().then(r.t.bind(r,3642,23)),Promise.resolve().then(r.t.bind(r,7586,23)),Promise.resolve().then(r.t.bind(r,7838,23)),Promise.resolve().then(r.t.bind(r,8057,23)),Promise.resolve().then(r.t.bind(r,7741,23)),Promise.resolve().then(r.t.bind(r,3118,23))},2419:(e,t,r)=>{Promise.resolve().then(r.t.bind(r,4080,23))},4955:(e,t,r)=>{"use strict";r.r(t),r.d(t,{$$ACTION_0:()=>u,$$ACTION_1:()=>x,default:()=>f,dynamic:()=>m});var a=r(2051),i=r(4214);r(4674);var s=r(2349),n=r(1288),l=r(3350),o=r(6910),d=r(3821),c=r(6778);let m="force-dynamic";var p=(0,i.j)("d73c6027b03fba72c307293251f3c736d7f67307",u);async function u(e){let t=Number(e.get("id"));if(!t)return;let a=(0,l.z)(),i=a.prepare("SELECT * FROM articles WHERE id = ?").get(t);if(i){a.prepare("DELETE FROM articles WHERE id = ?").run(t);let{removeArticleDir:e}=await Promise.resolve().then(r.bind(r,3821));e(i)}(0,c.revalidatePath)("/articles")}var h=(0,i.j)("fb6733cf50002a534d53e8f73da1bb6ce1a15323",x);async function x(e){let t=Number(e.get("id"));if(!t)return;let r=(0,l.z)();if(r.prepare("SELECT * FROM articles WHERE id = ?").get(t)){let e=Math.floor(Date.now()/1e3);r.prepare("UPDATE articles SET status='published', published_at=COALESCE(published_at, ?), updated_at=? WHERE id=?").run(e,e,t);let a=r.prepare("SELECT * FROM articles WHERE id = ?").get(t);(0,d.g)(a)}(0,c.revalidatePath)("/articles"),(0,c.revalidatePath)("/")}async function f({searchParams:e}){await (0,o.Gg)()||(0,n.redirect)("/login");let{q:t="",status:r=""}=await e,i=(0,l.z)(),d=[],c=[];t&&(d.push("(domain LIKE ? OR title LIKE ?)"),c.push(`%${t}%`,`%${t}%`)),r&&(d.push("status = ?"),c.push(r));let m=`SELECT id, domain, title, status, updated_at FROM articles ${d.length?"WHERE "+d.join(" AND "):""} ORDER BY updated_at DESC LIMIT 500`,u=i.prepare(m).all(...c);return(0,a.jsxs)("div",{className:"min-h-screen",children:[a.jsx("nav",{className:"bg-white border-b border-slate-200",children:a.jsx("div",{className:"max-w-5xl mx-auto px-6 py-4 flex items-center justify-between",children:(0,a.jsxs)("div",{className:"flex items-center gap-6",children:[a.jsx("h1",{className:"text-lg font-semibold",children:"Article Panel"}),a.jsx(s.default,{href:"/",className:"text-sm text-slate-600 hover:text-slate-900",children:"Dashboard"}),a.jsx(s.default,{href:"/articles",className:"text-sm text-slate-900 font-medium",children:"Articles"}),a.jsx(s.default,{href:"/articles/new",className:"text-sm text-blue-600 hover:text-blue-800",children:"+ New"}),a.jsx(s.default,{href:"/deploy",className:"text-sm text-slate-600 hover:text-slate-900",children:"Deploy"})]})})}),(0,a.jsxs)("main",{className:"max-w-5xl mx-auto px-6 py-10",children:[(0,a.jsxs)("form",{className:"flex gap-2 mb-6",children:[a.jsx("input",{name:"q",defaultValue:t,placeholder:"Search domain or title…",className:"flex-1 border border-slate-300 rounded px-3 py-2 text-sm"}),(0,a.jsxs)("select",{name:"status",defaultValue:r,className:"border border-slate-300 rounded px-3 py-2 text-sm",children:[a.jsx("option",{value:"",children:"All status"}),a.jsx("option",{value:"draft",children:"Draft"}),a.jsx("option",{value:"published",children:"Published"}),a.jsx("option",{value:"archived",children:"Archived"})]}),a.jsx("button",{className:"bg-slate-900 text-white px-4 py-2 rounded text-sm",children:"Filter"})]}),a.jsx("div",{className:"bg-white border border-slate-200 rounded-lg overflow-hidden",children:(0,a.jsxs)("table",{className:"w-full text-sm",children:[a.jsx("thead",{className:"bg-slate-50 text-slate-500 text-left",children:(0,a.jsxs)("tr",{children:[a.jsx("th",{className:"px-5 py-2 font-medium",children:"Domain"}),a.jsx("th",{className:"px-5 py-2 font-medium",children:"Title"}),a.jsx("th",{className:"px-5 py-2 font-medium",children:"Status"}),a.jsx("th",{className:"px-5 py-2 font-medium",children:"Updated"}),a.jsx("th",{className:"px-5 py-2 font-medium text-right",children:"Actions"})]})}),(0,a.jsxs)("tbody",{children:[0===u.length&&a.jsx("tr",{children:a.jsx("td",{colSpan:5,className:"px-5 py-8 text-center text-slate-400",children:"No results."})}),u.map(e=>(0,a.jsxs)("tr",{className:"border-t border-slate-100 hover:bg-slate-50",children:[a.jsx("td",{className:"px-5 py-2 font-mono text-xs",children:a.jsx(s.default,{href:`/articles/${e.id}`,className:"text-blue-600 hover:underline",children:e.domain})}),a.jsx("td",{className:"px-5 py-2",children:e.title}),a.jsx("td",{className:"px-5 py-2",children:a.jsx("span",{className:`px-2 py-0.5 rounded text-xs font-medium ${"published"===e.status?"bg-green-100 text-green-700":"draft"===e.status?"bg-amber-100 text-amber-700":"bg-slate-100 text-slate-600"}`,children:e.status})}),a.jsx("td",{className:"px-5 py-2 text-slate-500",children:new Date(1e3*e.updated_at).toLocaleString()}),(0,a.jsxs)("td",{className:"px-5 py-2 text-right space-x-2",children:["published"!==e.status&&(0,a.jsxs)("form",{action:h,className:"inline",children:[a.jsx("input",{type:"hidden",name:"id",value:e.id}),a.jsx("button",{className:"text-xs text-green-700 hover:underline",children:"Publish"})]}),a.jsx(s.default,{href:`/articles/${e.id}`,className:"text-xs text-blue-600 hover:underline",children:"Edit"}),(0,a.jsxs)("form",{action:p,className:"inline",children:[a.jsx("input",{type:"hidden",name:"id",value:e.id}),a.jsx("button",{className:"text-xs text-red-600 hover:underline",onClick:e=>{confirm("Delete?")||e.preventDefault()},children:"Delete"})]})]})]},e.id))]})]})})]})]})}},4403:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>s,metadata:()=>i});var a=r(2051);r(7272);let i={title:"Article Panel",description:"Multi-domain static article publisher",robots:{index:!1,follow:!1}};function s({children:e}){return a.jsx("html",{lang:"en",children:a.jsx("body",{children:e})})}},6910:(e,t,r)=>{"use strict";r.d(t,{B3:()=>o,Gg:()=>c,Rf:()=>p,Uj:()=>m,kF:()=>u,oH:()=>h});var a=r(5832),i=r(5903),s=r(2845);let n="ap_session";function l(){let e=process.env.JWT_SECRET||"dev-secret-change-me-please-32chars";return new TextEncoder().encode(e)}async function o(e){return await new a.N(e).setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime("7d").sign(l())}async function d(e){let{payload:t}=await (0,i._)(e,l());return t}async function c(){let e=(0,s.cookies)(),t=e.get(n)?.value;if(!t)return null;try{return await d(t)}catch{return null}}async function m(e){(0,s.cookies)().set(n,e,{httpOnly:!0,sameSite:"lax",secure:!0,path:"/",maxAge:604800})}async function p(){(0,s.cookies)().delete(n)}async function u(){let e=await c();if(!e||"admin"!==e.role)throw new Response("Unauthorized",{status:401});return e}async function h(e){let t=process.env.ADMIN_PASSWORD||"changeme";if(e.length!==t.length)return!1;let r=0;for(let a=0;a<t.length;a++)r|=e.charCodeAt(a)^t.charCodeAt(a);return 0===r}},3821:(e,t,r)=>{"use strict";r.d(t,{g:()=>c,removeArticleDir:()=>m});var a=r(7561),i=r.n(a),s=r(9411),n=r.n(s);let l={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"},o=e=>String(e??"").replace(/[&<>"']/g,e=>l[e]),d=(e,t)=>`<!DOCTYPE html>
<html lang="${o(e.lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${o(e.title)}</title>
<meta name="description" content="${o(e.meta_description||e.header.slice(0,160))}">
<meta name="keywords" content="${o(e.keywords||"")}">
<meta property="og:title" content="${o(e.title)}">
<meta property="og:description" content="${o(e.meta_description||e.header.slice(0,160))}">
<meta property="og:type" content="article">
<meta property="og:url" content="https://${o(e.domain)}/">
${e.og_image?`<meta property="og:image" content="${o(e.og_image)}">`:""}
<meta name="robots" content="index,follow">
<link rel="canonical" href="https://${o(e.domain)}/">
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
  <h1>${o(e.title)}</h1>
  <p class="lead">${o(e.header)}</p>
</header>
<main>
  <article>
    ${t}
  </article>
</main>
<footer class="site">
  &copy; ${new Date().getFullYear()} ${o(e.domain)}. All rights reserved.
</footer>
</body>
</html>
`;function c(e,t){let r=t||process.env.SITES_DIR||n().join(process.cwd(),"public","sites"),a=n().join(r,e.domain);i().mkdirSync(a,{recursive:!0});let s=n().join(a,"index.html");i().writeFileSync(s,function(e){let t=e.body_html&&e.body_html.trim().length>0?e.body_html:`<p>${o(e.header)}</p>`;return d(e,t)}(e),"utf8");let l=n().relative(process.cwd(),s).replace(/\\/g,"/");return{path:s,relPath:l}}function m(e,t){let r=t||process.env.SITES_DIR||n().join(process.cwd(),"public","sites"),a=n().join(r,e.domain);i().existsSync(a)&&i().rmSync(a,{recursive:!0,force:!0})}},3350:(e,t,r)=>{"use strict";r.d(t,{z:()=>p});let a=require("better-sqlite3");var i=r.n(a),s=r(9411),n=r.n(s),l=r(7561),o=r.n(l);let d=n().join(process.cwd(),"data");o().existsSync(d)||o().mkdirSync(d,{recursive:!0});let c=n().join(d,"app.db"),m=null;function p(){return m||((m=new(i())(c)).pragma("journal_mode = WAL"),m.pragma("foreign_keys = ON"),m.exec(`
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
  `)),m}},7272:()=>{}};var t=require("../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),a=t.X(0,[787,387,63,169,329,778],()=>r(9042));module.exports=a})();