#!/usr/bin/env bash
# Setup nginx to include article-panel config and allow passwordless reload for the app user.
# Run as root ONCE on the VPS.
set -e

INCLUDE="/etc/nginx/sites-enabled/articles.conf"

# 1. Ensure sites-enabled is included from nginx.conf
if ! grep -q "sites-enabled" /etc/nginx/nginx.conf; then
  echo "⚠️  /etc/nginx/nginx.conf belum include sites-enabled. Tambahkan baris:"
  echo "   include /etc/nginx/sites-enabled/*;"
  echo "di dalam block http {} lalu rerun script ini."
  exit 1
fi

# 2. Allow app user to reload nginx without password
APP_USER="${SUDO_USER:-www-data}"
NGINX_BIN="$(which nginx)"
cat > /etc/sudoers.d/article-panel <<EOF
${APP_USER} ALL=(ALL) NOPASSWD: ${NGINX_BIN} -s reload
${APP_USER} ALL=(ALL) NOPASSWD: ${NGINX_BIN} -t
EOF
chmod 440 /etc/sudoers.d/article-panel

# 3. Ensure sites dir readable by nginx
mkdir -p /var/www/article-panel/public/sites
chown -R ${APP_USER}:www-data /var/www/article-panel/public/sites
chmod -R 755 /var/www/article-panel/public/sites

echo "✅ Setup complete."
echo "   - ${INCLUDE} akan di-symlink otomatis saat deploy dari panel"
echo "   - ${APP_USER} bisa 'sudo ${NGINX_BIN} -s reload' tanpa password"
echo ""
echo "Set di .env VPS:"
echo "   SITES_DIR=/var/www/article-panel/public/sites"
echo "   NGINX_SITES_DIR=/var/www/article-panel/nginx/sites"
echo "   NGINX_INCLUDE_PATH=${INCLUDE}"
echo "   NGINX_RELOAD_CMD=sudo ${NGINX_BIN} -s reload"
