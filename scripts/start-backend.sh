#!/bin/sh
set -eu

APP_DIR="/app/backend"
DATA_DIR="$APP_DIR/database"
SEED_DIR="/app/bootstrap/database"

mkdir -p "$DATA_DIR"

# Seed the SQLite database if it does not exist yet.
if [ ! -f "$DATA_DIR/socNet.db" ] && [ -f "$SEED_DIR/socNet.db" ]; then
	cp "$SEED_DIR/socNet.db" "$DATA_DIR/socNet.db"
fi

# Ensure migrations are available on the mounted volume.
if [ -d "$DATA_DIR/migrations" ]; then
	rm -rf "$DATA_DIR/migrations"
fi
ln -s "$SEED_DIR/migrations" "$DATA_DIR/migrations"

cd "$APP_DIR"
exec "$APP_DIR/socNet"
