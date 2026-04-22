#!/usr/bin/env sh

set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
ENV_FILE="$ROOT_DIR/env/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing env file: $ENV_FILE"
  echo "Create it first (you can copy env/.env.example)."
  exit 1
fi

set -a
. "$ENV_FILE"
set +a

for var in UI_PORT SERVER_PORT DB_PORT POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB; do
  eval "value=\${$var:-}"
  if [ -z "$value" ]; then
    echo "Missing required variable in env/.env: $var"
    exit 1
  fi
done

# ── 1. Build & start core services ──────────────────────────────────────────
echo ""
echo "==> Building and starting containers (ui, server, db, adminer)..."
docker compose --env-file "$ENV_FILE" up -d --build --remove-orphans

# ── 2. Wait for DB to be healthy ─────────────────────────────────────────────
echo ""
echo "==> Waiting for database to be ready..."
RETRIES=30
i=0
until docker compose --env-file "$ENV_FILE" exec -T db \
    pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" > /dev/null 2>&1; do
  i=$((i + 1))
  if [ "$i" -ge "$RETRIES" ]; then
    echo "ERROR: Database did not become ready in time."
    exit 1
  fi
  printf "."
  sleep 2
done
echo " ready."

# ── 3. Check if data already imported ────────────────────────────────────────
echo ""
echo "==> Checking if data is already present..."
ROW_COUNT=$(docker compose --env-file "$ENV_FILE" exec -T db \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc \
  "SELECT COUNT(*) FROM restaurants;" 2>/dev/null || echo "0")

ROW_COUNT=$(echo "$ROW_COUNT" | tr -d '[:space:]')

if [ "$ROW_COUNT" -gt "0" ] 2>/dev/null; then
  echo "    Data already present ($ROW_COUNT restaurants) — skipping import."
else
  # ── 4. Run importer if JSONL files are available ──────────────────────────
  JSONL_REST="$ROOT_DIR/bdd/all_restaurants.jsonl"
  JSONL_HOTEL="$ROOT_DIR/bdd/all_hotels.jsonl"

  if [ -f "$JSONL_REST" ] && [ -f "$JSONL_HOTEL" ]; then
    echo "    No data found. Starting data import (this may take several minutes)..."
    docker compose --env-file "$ENV_FILE" --profile import up --build importer
    echo "    Import finished."
  else
    echo "    No data found and no JSONL files in bdd/ — skipping import."
    echo "    Put all_restaurants.jsonl and all_hotels.jsonl in bdd/ then re-run deploy.sh."
  fi
fi

# ── 5. Summary ───────────────────────────────────────────────────────────────
echo ""
echo "==> Deployment complete."
echo ""
echo "    UI        http://localhost:${UI_PORT}"
echo "    API       http://localhost:${SERVER_PORT}/api/restaurants"
echo "    Adminer   http://localhost:${ADMINER_PORT:-8080}"
echo ""
