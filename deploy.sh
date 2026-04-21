#!/usr/bin/env sh

set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
ENV_FILE="$ROOT_DIR/env/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing env file: $ENV_FILE"
  echo "Create it first (you can copy env/.env.example)."
  exit 1
fi

# Load and validate shared environment for all services.
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

echo "Starting ui + server + db containers..."
docker compose --env-file "$ENV_FILE" up -d --build --remove-orphans
echo "Deployment done."