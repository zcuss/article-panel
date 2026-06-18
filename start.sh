#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
export PORT="${PORT:-3000}"
export HOSTNAME="${HOSTNAME:-127.0.0.1}"
if [ -f .next/standalone/server.js ]; then
  exec node .next/standalone/server.js
else
  echo "Installing deps (no standalone)..."
  npm ci --omit=dev --no-audit --no-fund
  exec npx next start -p "${PORT}" -H "${HOSTNAME}"
fi
