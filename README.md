# Article Panel

Next.js 14 CRUD for static SEO articles. Each domain (e.g. `ram.web.id`) gets its own `index.html`, served by nginx from a single root. One VPS, 200+ domains, zero Next.js in the request path.

## Stack
- **Next.js 14** App Router (admin UI only)
- **SQLite** via `better-sqlite3` (single file at `data/app.db`)
- **AI** OpenAI-compatible `/chat/completions` (OpenAI, OpenRouter, Together, llama.cpp, etc.)
- **nginx** 1 server block per published domain, all rooted at `public/sites/<domain>/index.html`

## Quick start

```bash
cd article-panel
cp .env.example .env
# edit .env: ADMIN_PASSWORD, AI_API_KEY, paths

npm install
npm run dev
# open http://localhost:3000
```

## Production deploy on VPS

### Option A — clone prebuilt (recommended, fastest)

The GitHub Action builds on every push to `main` and pushes the result to the `build` branch. On the VPS:

```bash
git clone -b build https://github.com/<you>/<repo>.git /opt/article-panel
cd /opt/article-panel
# one-time VPS setup as root (creates sudoers entry for nginx reload)
bash scripts/setup-vps.sh   # but run from a source checkout; see Option B if you only have build branch
# create .env with your secrets
cp .env.example .env && nano .env
# run
./start.sh                  # listens on 127.0.0.1:3000
```

No `npm install`, no `npm run build`. The bundle includes its own `node_modules` via Next.js standalone output.

### Option B — build on the VPS (source checkout)

```bash
git clone https://github.com/<you>/<repo>.git /opt/article-panel
cd /opt/article-panel/article-panel
npm install
npm run build
sudo bash scripts/setup-vps.sh
node .next/standalone/server.js
```

Put this in `/etc/nginx/nginx.conf` (inside `http {}`):
```
http {
    include /etc/nginx/sites-enabled/*;
    # ... existing config
}
```

## GitHub Actions

`.github/workflows/build.yml` runs on every push to `main`:
1. `npm install` + `npm run build` (Next.js standalone)
2. Bundles `.next/standalone`, `.next/static`, `public/`, `package.json`, `start.sh` into `runtime/`
3. Force-pushes `runtime/` to the `build` branch

To deploy a new version: just `git push` to `main`. On the VPS: `cd /opt/article-panel && git pull origin build && sudo systemctl restart article-panel` (or restart your process manager).

## Workflow
1. **Login** → `/login` (env password)
2. **Import** domains in bulk: `npx tsx scripts/import-domains.ts ../checker/available.txt`
3. **Per article** → `/articles/new` → fill domain, title, header → click **Generate with AI** → review HTML → **Save** (status=draft)
4. **Publish** → flip status to `published` (or click Publish in list)
5. **Deploy** → `/deploy` → **Build All** then **Generate + Reload Nginx**

Each `published` article writes `public/sites/<domain>/index.html`. The deploy button regenerates every server block into `nginx/sites/_all.conf`, symlinks it to `/etc/nginx/sites-enabled/articles.conf`, and runs `sudo nginx -s reload`.

## Process manager (optional)

The panel just needs Node. With systemd:

```ini
# /etc/systemd/system/article-panel.service
[Unit]
Description=Article Panel
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/article-panel
EnvironmentFile=/opt/article-panel/.env
ExecStart=/usr/bin/node .next/standalone/server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now article-panel
```

## Reverse-proxy the panel (optional)

If you want the admin UI behind a friendly URL (e.g. `panel.yourdomain.com`) on a private IP, in one of the nginx server blocks:

```
server {
    server_name panel.yourdomain.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## AI provider
Any OpenAI-compatible `/chat/completions` endpoint. Configure in `.env`:
- `AI_BASE_URL` (default `https://api.openai.com/v1`)
- `AI_API_KEY`
- `AI_MODEL`
- `AI_EXTRA_HEADER` (e.g. `HTTP-Referer: https://yoursite.com` for OpenRouter)

## File layout
```
app/
  page.tsx               dashboard
  login/                 login form
  articles/              CRUD UI
  deploy/                build + nginx reload
  api/                   REST endpoints
lib/
  db.ts                  better-sqlite3 schema
  auth.ts                JWT cookie + password check
  ai.ts                  OpenAI-compatible client
  build.ts               HTML template + writer
  nginx.ts               server block generator
  validators.ts          zod schemas
public/sites/<domain>/   generated static HTML
nginx/sites/             generated nginx configs
data/app.db              SQLite database
scripts/
  import-domains.ts      bulk import from .txt
  setup-vps.sh           one-time VPS setup (sudo)
```

## Security notes
- Single admin password (env). No user management.
- AI and admin endpoints are session-gated (JWT cookie).
- Static files are written to disk outside Next.js; nginx serves them directly.
- Rate limiting / brute force protection: add nginx `limit_req` outside the per-domain block.
