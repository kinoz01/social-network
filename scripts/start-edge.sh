#!/bin/sh
set -eu

cleanup() {
  if [ -n "${BACK_PID:-}" ]; then
    kill "$BACK_PID" 2>/dev/null || true
    wait "$BACK_PID" 2>/dev/null || true
  fi

  if [ -n "${FRONT_PID:-}" ]; then
    kill "$FRONT_PID" 2>/dev/null || true
    wait "$FRONT_PID" 2>/dev/null || true
  fi
}

trap cleanup INT TERM

/app/scripts/start-backend.sh &
BACK_PID=$!

(
  cd /app/frontend
  npm start -- --hostname 0.0.0.0 --port 3001
) &
FRONT_PID=$!

caddy run --config /app/Caddyfile
STATUS=$?

cleanup
exit $STATUS
