#!/usr/bin/env bash
# Start the app. Run as root (or any user with sudoers installed).
set -euo pipefail
cd "$(dirname "$0")/.."

export PORT="${PORT:-3000}"
export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export SITES_DIR="${SITES_DIR:-/var/www/sites}"
export NGINX_SITES_DIR="${NGINX_SITES_DIR:-/etc/nginx/sites-enabled}"

exec npm start