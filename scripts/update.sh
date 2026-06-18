#!/usr/bin/env bash
# Pull latest build, restart app, reload nginx.
set -euo pipefail

REPO="https://github.com/zcuss/article-panel.git"
BRANCH="build"
INSTALL_DIR="/opt/article-panel"

if [[ $EUID -ne 0 ]]; then
  echo "Run as root: sudo bash $0"
  exit 1
fi

cd "$INSTALL_DIR"
git config --global --add safe.directory "$INSTALL_DIR" || true
git fetch --depth 1 origin "$BRANCH"
git reset --hard "origin/$BRANCH"
chown -R article:article "$INSTALL_DIR" || true

systemctl restart article-panel
systemctl reload nginx

echo "✅ Updated to $(git rev-parse --short HEAD)"
