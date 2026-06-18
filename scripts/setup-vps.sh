#!/usr/bin/env bash
# One-shot VPS installer. Run as root.
#   curl -fsSL https://raw.githubusercontent.com/zcuss/article-panel/build/scripts/setup-vps.sh | sudo bash -s -- --admin-domain panel.domain.com
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
  echo "ERR: run as root: curl ... | sudo bash -s -- ..."
  exit 1
fi

if [[ -z "$ADMIN_DOMAIN" ]]; then
  ADMIN_DOMAIN=$(hostname -f 2>/dev/null || hostname || "localhost")
fi

# Progress UI
TOTAL=9
STEP=0
BAR_W=20
step() {
  STEP=$((STEP+1))
  local pct=$((STEP * 100 / TOTAL))
  local filled=$((pct * BAR_W / 100))
  local empty=$((BAR_W - filled))
  local bar
  bar=$(printf '█%.0s' $(seq 1 $filled))
  bar+=$(printf '░%.0s' $(seq 1 $empty))
  printf '\r\033[K\033[1;36m[%s]\033[0m %3d%%  %-32s ' "$bar" "$pct" "$1"
}

run() {
  step "$1"
  shift
  local t=$SECONDS
  if "$@" >/tmp/setup.log 2>&1; then
    printf '\033[1;32mOK\033[0m  %2ds\n' $((SECONDS-t))
  else
    printf '\033[1;31mFAIL\033[0m %2ds\n' $((SECONDS-t))
    echo "  --- last 8 lines ---"
    tail -8 /tmp/setup.log | sed 's/^/  /'
    return 1
  fi
}

run_tolerate() {
  step "$1"
  shift
  local t=$SECONDS
  "$@" >/tmp/setup.log 2>&1 || true
  printf '\033[1;33mOK*\033[0m %2ds (warnings ignored)\n' $((SECONDS-t))
}

export DEBIAN_FRONTEND=noninteractive

cat <<'BANNER'
================================================
  Article Panel installer
================================================
BANNER
echo "  Admin domain: $ADMIN_DOMAIN"
echo "  Install dir:  $INSTALL_DIR"
echo "  App port:     $APP_PORT"
echo

run_tolerate "apt update"             apt-get update -y
run         "Install system packages" apt-get install -y --no-install-recommends nginx git curl ca-certificates ufw openssl
if ! command -v node >/dev/null; then
  run_tolerate "Install Node.js 20" bash -c 'curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null 2>&1; apt-get install -y nodejs'
fi
run "Node version" bash -c 'node -v >/dev/null'
printf "         Node %s\n" "$(node -v)"

if ! id "$APP_USER" >/dev/null 2>&1; then
  run "Create user $APP_USER" adduser --system --group --no-create-home --shell /usr/sbin/nologin "$APP_USER"
fi

if [[ -d "$INSTALL_DIR/.git" ]]; then
  run "Update existing install" bash -c "cd '$INSTALL_DIR' && git fetch --depth 1 origin '$BRANCH' && git reset --hard 'origin/$BRANCH'"
else
  run "Clone build branch" git clone --depth 1 --branch "$BRANCH" "$REPO" "$INSTALL_DIR"
fi

if [[ ! -f "$INSTALL_DIR/.env" ]]; then
  run "Generate .env + secrets" bash -c "cd '$INSTALL_DIR' && cp .env.example .env && APW=\$(openssl rand -hex 12) && JWS=\$(openssl rand -hex 32) && sed -i 's|^ADMIN_PASSWORD=.*|ADMIN_PASSWORD='\"\$APW\"'|' .env && sed -i 's|^JWT_SECRET=.*|JWT_SECRET='\"\$JWS\"'|' .env && echo '  password: '\$APW"
fi

chown -R "$APP_USER":"$APP_USER" "$INSTALL_DIR" 2>/dev/null || true
chmod 600 "$INSTALL_DIR/.env" 2>/dev/null || true

run "Write sudoers + systemd + nginx" bash -c "
set -e
cat > /etc/sudoers.d/article-panel <<SEOF
$APP_USER ALL=(ALL) NOPASSWD: /usr/sbin/nginx -t
$APP_USER ALL=(ALL) NOPASSWD: /usr/sbin/nginx -s reload
$APP_USER ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx
SEOF
chmod 440 /etc/sudoers.d/article-panel
visudo -c -f /etc/sudoers.d/article-panel

cat > /etc/systemd/system/article-panel.service <<SVCEOF
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
SVCEOF
systemctl daemon-reload
systemctl enable --now article-panel.service

mkdir -p /etc/nginx/sites-enabled
cat > /etc/nginx/sites-enabled/articles.conf <<NGXEOF
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
server {
    listen 80 default_server;
    server_name _;
    root $INSTALL_DIR/.next/standalone/public/sites/\$host;
    index index.html;
    location / { try_files \$uri \$uri/ =404; }
}
NGXEOF

mkdir -p '$INSTALL_DIR/.next/standalone/public/sites'
chown -R '$APP_USER':'$APP_USER' '$INSTALL_DIR/.next/standalone/public'
nginx -t
systemctl reload nginx
"

run_tolerate "Open firewall ports" bash -c 'command -v ufw >/dev/null && (yes | ufw enable >/dev/null 2>&1; ufw allow 22/tcp >/dev/null 2>&1; ufw allow 80/tcp >/dev/null 2>&1; ufw allow 443/tcp >/dev/null 2>&1) || echo "ufw not installed"'

VPS_IP=$(curl -s --max-time 5 https://api.ipify.org 2>/dev/null || echo "this-VPS-IP")

cat <<EOF

================================================
  DONE in ${SECONDS}s
================================================
  Admin panel:  http://$ADMIN_DOMAIN
  Password:     see $INSTALL_DIR/.env (ADMIN_PASSWORD)
  Install dir:  $INSTALL_DIR
  Service:      systemctl {status|restart|logs} article-panel
  Update:       curl -fsSL https://raw.githubusercontent.com/zcuss/article-panel/build/scripts/update.sh | sudo bash
  Uninstall:    curl -fsSL https://raw.githubusercontent.com/zcuss/article-panel/build/scripts/uninstall.sh | sudo bash -s -- --remove-data

  DNS: point $ADMIN_DOMAIN -> $VPS_IP
================================================
EOF
