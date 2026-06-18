#!/usr/bin/env bash
# Bootstrap script. Run once after cloning.
#   git clone https://github.com/zcuss/article-panel
#   cd article-panel
#   sudo ./scripts/install.sh
#
# What it does:
#   1. Install nginx + ufw via apt
#   2. Create /var/www/sites + /etc/nginx/sites-enabled
#   3. Drop sudoers fragment (so app can manage nginx/ufw)
#   4. Write .env with random secrets (first time only)
#   5. npm install + build
#   6. Start app on port 3000
set -euo pipefail

log() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
ok()  { printf '\033[1;32mOK\033[0m  %s\n' "$*"; }
die() { printf '\033[1;31mERR\033[0m %s\n' "$*"; exit 1; }

[[ $EUID -ne 0 ]] && die "run as root: sudo $0"

cd "$(dirname "$0")/.."
ROOT="$(pwd)"

# 1. System packages
if command -v nginx >/dev/null; then ok "nginx installed"; else
  log "Installing nginx"
  apt-get update -y >/dev/null
  DEBIAN_FRONTEND=noninteractive apt-get install -y nginx ufw
  ok "nginx installed"
fi

# 2. Site directories
log "Creating directories"
mkdir -p /var/www/sites /etc/nginx/sites-enabled
chmod 755 /var/www/sites
ok "/var/www/sites ready"

# 3. Sudoers
SUDOERS_FILE=/etc/sudoers.d/article-panel
if [[ -f etc/article-panel.sudoers ]]; then
  log "Installing sudoers"
  # Replace placeholder user with actual sudo invoker (so app user can run these too).
  ACTOR="${SUDO_USER:-root}"
  sed "s|^root ALL = NOPASSWD:|${ACTOR} ALL = NOPASSWD:|" etc/article-panel.sudoers > "$SUDOERS_FILE"
  chmod 440 "$SUDOERS_FILE"
  visudo -c -f "$SUDOERS_FILE" >/dev/null
  ok "sudoers installed (user: $ACTOR)"
else
  die "etc/article-panel.sudoers not found"
fi

# 4. .env
if [[ ! -f .env ]]; then
  log "Generating .env"
  cp .env.example .env
  sed -i "s|^ADMIN_PASSWORD=.*|ADMIN_PASSWORD=$(openssl rand -hex 12)|" .env
  sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$(openssl rand -hex 32)|" .env
  chmod 600 .env
  PASSWORD=$(grep ^ADMIN_PASSWORD .env | cut -d= -f2)
  ok "secrets generated"
  echo
  echo "    ADMIN PASSWORD: $PASSWORD"
  echo
fi

# 5. Node deps + build
log "npm install"
npm ci --no-audit --no-fund
log "Building Next.js"
npm run build

# Copy standalone runtime assets
if [ -d .next/standalone ]; then
  cp -r public .next/standalone/ 2>/dev/null || true
  cp -r .next/static .next/standalone/.next/ 2>/dev/null || true
  ok "standalone bundle ready"
fi

ok "build complete"

# 6. Done
cat <<EOF

================================================
  Article Panel ready
================================================
  App dir:   $ROOT
  Sudoers:   $SUDOERS_FILE
  Sites dir: /var/www/sites
  Nginx:     /etc/nginx/sites-enabled

  Start:     npm start     (port 3000)
  Or daemon: bash scripts/start.sh

  Visit:     http://this-vps:3000
  Login:     ADMIN_PASSWORD above

================================================
EOF