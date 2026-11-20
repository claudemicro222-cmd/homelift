#!/bin/sh
# Unraid skapar appdata-mappen som root. Ge användaren node skrivrätt och kör appen som node.
set -e
if [ "$(id -u)" = "0" ]; then
  mkdir -p "$DATA_DIR"
  chown -R node:node "$DATA_DIR" 2>/dev/null || true
  exec su node -s /bin/sh -c 'exec "$0" "$@"' -- "$@"
fi
exec "$@"
