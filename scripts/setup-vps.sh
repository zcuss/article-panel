#!/usr/bin/env bash
# One-shot VPS installer. Run as root.
#   curl -fsSL https://raw.githubusercontent.com/zcuss/article-panel/build/setup-vps.sh | bash -s -- --admin-domain panel.zcuss.web.id
set -euo pipefail

REPO="https://github.com/zcuss/article-panel.git"
BRANCH="build"
INSTALL_DIR="/opt/article-panel"
APP_USER="article"
ADMIN_DOMAIN=""
APP_PORT="3000"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --admin-domain) ADMIN_DOMAIN="$2"; shift 2;;
    --port) APP_PORT="$2"; shift 2;;
    --dir) INSTALL_DIR="$2"; shift 2;;
    *) echo "Unknown arg: $1"; exit 1;;
  esac
done

if [[ $EUID -ne 0 ]]; then
  echo "Run as root: curl ... | sudo bash -s -- ..."
  exit 1
fi

if [[ -z "$ADMIN_DOMAIN" ]]; then
  ADMIN_DOMAIN=$(hostname -f 2>/dev/null || hostname || "localhost")
fi

log() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
ok()  { printf '\033[1;32mOK\033[0m  %s\n' "$*"; }
die() { printf '\033[1;31mERR\033[0m %s\n' "$*"; exit 1; }

export DEBIAN_FRONTEND=noninteractive

log "Installing system packages"
apt-get update -y >/dev/null
apt-get install -y --no-install-recommends nginx git curl ca-certificates ufw openssl >/dev/null

if ! command -v node >/dev/null || ! node -v | grep -qE '^v20\.'; then
  log "Installing Node.js 20"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null
  apt-get install -y nodejs >/dev/null
fi
ok "Node $(node -v)"

if ! id "$APP_USER" >/dev/null 2>&1; then
  log "Creating user $APP_USER"
  adduser --system --group --no-create-home --shell /usr/sbin/nologin "$APP_USER"
fi

if [[ -d "$INSTALL_DIR/.git" ]]; then
  log "Updating $INSTALL_DIR from $BRANCH branch"
  cd "$INSTALL_DIR"
  git fetch --depth 1 origin "$BRANCH"
  git reset --hard "origin/$BRANCH"
else
  log "Cloning $BRANCH branch to $INSTALL_DIR"
  rm -rf "$INSTALL_DIR"
  git clone --depth 1 --branch "$BRANCH" "$REPO" "$INSTALL_DIR"
  cd "$INSTALL_DIR"
fi
ok "App source ready"

if [[ ! -f "$INSTALL_DIR/.env" ]]; then
  log "Generating .env"
  cp .env.example .env
  ADMIN_PW=$(openssl rand -hex 12)
  JWT_S=$(openssl rand -hex 32)
  sed -i "s|^ADMIN_PASSWORD=.*|ADMIN_PASSWORD=${ADMIN_PW}|" .env
  sed -i "s|^JWT_SECRET=.*|JWT_SECRET=${JWT_S}|" .env
  echo "  ADMIN_PASSWORD: $ADMIN_PW"
fi

chown -R "$APP_USER":"$APP_USER" "$INSTALL_DIR"
chmod 600 "$INSTALL_DIR/.env" 2>/dev/null || true

cat > /etc/sudoers.d/article-panel <<EOF
$APP_USER ALL=(ALL) NOPASSWD: /usr/sbin/nginx -t
$APP_USER ALL=(ALL) NOPASSWD: /usr/sbin/nginx -s reload
$APP_USER ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx
EOF
chmod 440 /etc/sudoers.d/article-panel
visudo -c -f /etc/sudoers.d/article-panel >/dev/null

cat > /etc/systemd/system/article-panel.service <<EOF
[Unit]
Description=Article Panel
After=network.target nginx.service

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$INSTALL_DIR
EnvironmentFile=$INSTALL_DIR/.env
Environment=PORT=$APP_PORT
Environment=HOSTNAME=127.0.0.1
ExecStart=/usr/bin/env node .next/standalone/server.js
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable --now article-panel.service
ok "App service running on 127.0.0.1:$APP_PORT"

mkdir -p /etc/nginx/sites-enabled
cat > /etc/nginx/sites-enabled/articles.conf <<EOF
# Admin UI (proxies to Next.js)
server {
    listen 80;
    server_name $ADMIN_DOMAIN;

    client_max_body_size 10m;

    location / {
        proxy_pass http://127.0.0.1:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 60s;
    }
}

# Catch-all: serve generated static sites from public/sites/<host>/
server {
    listen 80 default_server;
    server_name _;

    root $INSTALL_DIR/public/sites/\$host;
    index index.html;

    location / {
        try_files \$uri \$uri/ =404;
    }
}
EOF

mkdir -p "$INSTALL_DIR/public/sites"
chown -R "$APP_USER":"$APP_USER" "$INSTALL_DIR/public"

nginx -t
systemctl reload nginx
ok "Nginx configured"

if command -v ufw >/dev/null; then
  ufw allow 22/tcp >/dev/null 2>&1 || true
  ufw allow 80/tcp >/dev/null 2>&1 || true
  ufw allow 443/tcp >/dev/null 2>&1 || true
  yes | ufw enable >/dev/null 2>&1 || true
fi

cat <<EOF

================================================
  Article Panel installed
================================================
  Admin panel:  http://$ADMIN_DOMAIN
  Password:     see $INSTALL_DIR/.env (ADMIN_PASSWORD)
  Install dir:  $INSTALL_DIR
  Service:      systemctl {status|restart|logs} article-panel
  Update:       curl -fsSL https://raw.githubusercontent.com/zcuss/article-panel/build/update.sh | sudo bash

  DNS: point $ADMIN_DOMAIN -> $(curl -s https://api.ipify.org 2>/dev/null || echo "this VPS IP")
EOF
