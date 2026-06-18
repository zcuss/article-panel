#!/usr/bin/env bash
# Full uninstall. Removes app, service, nginx config, sudoers.
# Optionally purges nginx + node packages.
set -euo pipefail

INSTALL_DIR="/opt/article-panel"
APP_USER="article"
SERVICE_NAME="article-panel"
SUDOERS_FILE="/etc/sudoers.d/article-panel"
NGINX_CONF="/etc/nginx/sites-enabled/articles.conf"

if [[ $EUID -ne 0 ]]; then
  echo "Run as root: sudo bash $0"
  exit 1
fi

PURGE_PKGS=0
REMOVE_FILES=0
for arg in "$@"; do
  case "$arg" in
    --purge) PURGE_PKGS=1 ;;
    --remove-data) REMOVE_FILES=1 ;;
    -y|--yes) ;;
    *)
      echo "Unknown arg: $arg"
      echo "Usage: $0 [--purge] [--remove-data] [-y]"
      exit 1
      ;;
  esac
done

log() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
ok()  { printf '\033[1;32mOK\033[0m  %s\n' "$*"; }

# 1. Stop + disable service
if systemctl list-unit-files "${SERVICE_NAME}.service" >/dev/null 2>&1; then
  log "Stopping $SERVICE_NAME"
  systemctl stop "$SERVICE_NAME" 2>/dev/null || true
  systemctl disable "$SERVICE_NAME" 2>/dev/null || true
  rm -f "/etc/systemd/system/${SERVICE_NAME}.service"
  systemctl daemon-reload
  ok "Service removed"
fi

# 2. Sudoers
if [[ -f "$SUDOERS_FILE" ]]; then
  log "Removing sudoers"
  rm -f "$SUDOERS_FILE"
  ok "Sudoers removed"
fi

# 3. Nginx config
if [[ -f "$NGINX_CONF" ]]; then
  log "Removing nginx config"
  rm -f "$NGINX_CONF"
  if command -v nginx >/dev/null; then
    nginx -t 2>/dev/null && systemctl reload nginx 2>/dev/null || true
  fi
  ok "Nginx config removed"
fi

# 4. App directory
if [[ -d "$INSTALL_DIR" ]]; then
  if [[ "$REMOVE_FILES" -eq 1 ]]; then
    log "Removing $INSTALL_DIR"
    rm -rf "$INSTALL_DIR"
    ok "App dir removed"
  else
    echo "App dir kept: $INSTALL_DIR (use --remove-data to delete)"
  fi
fi

# 5. App user
if id "$APP_USER" >/dev/null 2>&1; then
  log "Removing user $APP_USER"
  userdel "$APP_USER" 2>/dev/null || true
  ok "User removed"
fi

# 6. Optionally purge packages
if [[ "$PURGE_PKGS" -eq 1 ]]; then
  log "Purging packages (nginx, ufw, openssl). Keeping git + curl."
  apt-get purge -y nginx nginx-common nginx-full 2>/dev/null || true
  apt-get purge -y ufw openssl 2>/dev/null || true
  apt-get autoremove -y >/dev/null
  ok "Packages purged"
else
  echo "Packages kept (use --purge to remove nginx, ufw, openssl)"
fi

# 7. Firewall
if command -v ufw >/dev/null; then
  echo "Run 'sudo ufw delete allow 80/tcp && sudo ufw delete allow 443/tcp' manually if needed"
fi

cat <<EOF

================================================
  Article Panel uninstalled
================================================
  Service:    removed
  Sudoers:    removed
  Nginx conf: removed
  App data:   $([ "$REMOVE_FILES" -eq 1 ] && echo "removed" || echo "kept at $INSTALL_DIR")
  Packages:   $([ "$PURGE_PKGS" -eq 1 ] && echo "purged" || echo "kept")
================================================
EOF
