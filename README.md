# article-panel

Multi-domain static article CMS. One Next.js admin panel publishes per-domain HTML files served directly by nginx — **zero Node.js in the request path** for published sites, so 200+ domains per VPS is fine.

## VPS install (one command)

As root, with the domain you want for the admin panel pointed at this VPS:

```bash
curl -fsSL https://raw.githubusercontent.com/zcuss/article-panel/build/scripts/setup-vps.sh | bash -s -- --admin-domain panel.yourdomain.com
```

That single command:
1. Installs nginx + node 20 + git + ufw + openssl
2. Clones the `build` branch into `/opt/article-panel`
3. Generates a random `ADMIN_PASSWORD` and `JWT_SECRET` in `.env`
4. Configures sudoers so the app can reload nginx without password
5. Installs a `systemd` service (`article-panel.service`)
6. Writes nginx config: admin domain -> proxy to Next.js, every other domain -> static files from `public/sites/<host>/`
7. Opens firewall ports 22/80/443

## DNS

| Hostname | Type | Value |
|---|---|---|
| `panel.yourdomain.com` | A | VPS_IP |
| `ram.web.id` | A | VPS_IP |
| any domain you publish | A | VPS_IP |

Nginx auto-serves `ram.web.id` from `/opt/article-panel/public/sites/ram.web.id/index.html` the moment you publish an article with that domain.

## Update

```bash
curl -fsSL https://raw.githubusercontent.com/zcuss/article-panel/build/scripts/update.sh | sudo bash
```

Pulls latest `build` branch, restarts service, reloads nginx.

## Uninstall

```bash
curl -fsSL https://raw.githubusercontent.com/zcuss/article-panel/build/scripts/uninstall.sh | sudo bash -s -- --remove-data
# add --purge to also remove nginx, ufw, openssl packages
```

## Configure AI / change password

After install, open `http://panel.yourdomain.com` -> **Settings** -> fill in:
- `AI_BASE_URL` (e.g. `https://api.openai.com/v1`)
- `AI_API_KEY`
- `AI_MODEL` (e.g. `gpt-4o-mini`)

Saved to `.env` on disk, picked up on the next AI request. No restart needed for AI changes.

Changing `ADMIN_PASSWORD` or `JWT_SECRET` requires a restart:
```bash
sudo systemctl restart article-panel
```

## Local dev

```bash
cd article-panel
npm install
npm run dev    # http://localhost:3000
```

## Deploy

```bash
git push       # GitHub Actions builds + pushes to `build` branch
```

On VPS, `update.sh` pulls the new `build` branch.

## Service management

```bash
sudo systemctl status article-panel
sudo systemctl restart article-panel
sudo journalctl -u article-panel -f
```

## Layout

```
/opt/article-panel/
├── .env                   # generated, chmod 600
├── .next/standalone/      # node + bundled deps
├── public/sites/<domain>/ # generated static sites
├── data/app.db            # sqlite
├── nginx/sites/           # per-domain nginx snippets (auto-generated)
└── scripts/               # setup-vps.sh, update.sh
```
