# article-panel

Multi-domain static article CMS. One Next.js admin panel publishes per-domain HTML files served directly by nginx — **zero Node.js in the request path** for published sites, so 200+ domains per VPS is fine.

The dashboard itself manages nginx + ufw + sites — no manual server edits.

## VPS install

```bash
git clone https://github.com/zcuss/article-panel.git
cd article-panel
sudo ./scripts/install.sh
```

That single script:
1. Installs nginx + ufw via apt
2. Creates `/var/www/sites` and `/etc/nginx/sites-enabled`
3. Drops a sudoers fragment so the app can manage nginx + ufw + sites without password
4. Writes `.env` with random `ADMIN_PASSWORD` and `JWT_SECRET`
5. Runs `npm install` + `npm run build`
6. Prints the admin password

Then start:

```bash
npm start               # foreground
# or
bash scripts/start.sh   # same, sets default env
```

Visit `http://VPS_IP:3000`, log in with the printed password.

## What the dashboard controls

The **System** page lets you:

| Action | Effect |
|---|---|
| Test / reload nginx | runs `nginx -t` and `nginx -s reload` |
| Add domain | writes `/etc/nginx/sites-enabled/<domain>.conf` + `/var/www/sites/<domain>/`, reloads |
| Remove domain | deletes the above |
| Open port | `ufw allow <port>/tcp` |
| Close port | `ufw delete allow <port>/tcp` |
| View status | node version, nginx config status, ufw active/inactive, kernel |

All of these run via `sudo -n` (non-interactive). The sudoers file lives in `etc/article-panel.sudoers` — whitelisted to specific commands only, not full root.

## DNS

| Hostname | Type | Value |
|---|---|---|
| any domain you publish | A | VPS_IP |

Nginx auto-serves `ram.web.id` from `/var/www/sites/ram.web.id/index.html` the moment you publish an article with that domain.

## Configure AI / change password

Open `http://VPS_IP:3000` → **Settings** → fill in:
- `AI_BASE_URL` (e.g. `https://api.openai.com/v1`)
- `AI_API_KEY`
- `AI_MODEL` (e.g. `gpt-4o-mini`)

Saved to `.env` on disk, picked up on the next AI request. No restart for AI changes.

Changing `ADMIN_PASSWORD` or `JWT_SECRET` requires a restart:
```bash
# Ctrl+C the running npm start, then:
bash scripts/start.sh
```

## Local dev

```bash
git clone https://github.com/zcuss/article-panel.git
cd article-panel
npm install
npm run dev    # http://localhost:3000
```

## Update

```bash
git pull
npm install
npm run build
# restart your npm start
```

## Uninstall

```bash
sudo rm /etc/sudoers.d/article-panel
sudo rm -rf /var/www/sites
sudo rm -f /etc/nginx/sites-enabled/*.conf
sudo apt purge nginx ufw
cd .. && rm -rf article-panel
```

## Layout

```
article-panel/
├── app/                  # Next.js pages + API routes
│   ├── api/articles      # CRUD
│   ├── api/ai            # AI generation
│   ├── api/deploy        # write HTML + nginx reload
│   ├── api/settings      # edit .env
│   ├── api/system        # nginx, ufw, sites management
│   └── system/           # system dashboard page
├── lib/                  # db, auth, build, nginx, env, sh helpers
├── etc/article-panel.sudoers   # sudoers fragment (installed by scripts/install.sh)
├── scripts/install.sh          # bootstrap (install deps + sudoers + .env + build)
└── scripts/start.sh            # run npm start with default env
```