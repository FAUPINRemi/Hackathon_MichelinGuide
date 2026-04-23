#!/usr/bin/env sh

set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
ENV_FILE="$ROOT_DIR/env/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Ficher d'environnement manquant: $ENV_FILE"
  exit 1
fi

set -a
. "$ENV_FILE"
set +a

for var in UI_PORT SERVER_PORT DB_PORT POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB; do
  eval "value=\${$var:-}"
  if [ -z "$value" ]; then
    echo "Variable manquante: $var"
    exit 1
  fi
done


CERTS_DIR="$ROOT_DIR/credential/certs"
KEY_FILE="$CERTS_DIR/key.pem"
CERT_FILE="$CERTS_DIR/cert.pem"

if [ ! -f "$KEY_FILE" ] || [ ! -f "$CERT_FILE" ]; then
  echo "Génération du certificat TLS auto-signé..."
  mkdir -p "$CERTS_DIR"
  openssl req -x509 -newkey rsa:2048 -nodes \
    -keyout "$KEY_FILE" \
    -out "$CERT_FILE" \
    -days 365 \
    -subj "/CN=localhost" 2>/dev/null
  echo "Certificat généré dans $CERTS_DIR"
fi

echo "=Build et lancement des services principaux (API, DB, Adminer, UI)"
docker compose --env-file "$ENV_FILE" up -d --build --remove-orphans


echo "En attente de la bdd"
until docker compose --env-file "$ENV_FILE" exec -T db \
    pg_isready -U "$POSTGRES_USER" -d postgres > /dev/null 2>&1; do
  printf "."
  sleep 2
done
echo " Pret."

DB_EXISTS=$(docker compose --env-file "$ENV_FILE" exec -T db \
  psql -U "$POSTGRES_USER" -d postgres -tAc \
  "SELECT 1 FROM pg_database WHERE datname='$POSTGRES_DB';" 2>/dev/null || echo "")
DB_EXISTS=$(echo "$DB_EXISTS" | tr -d '[:space:]')

if [ "$DB_EXISTS" != "1" ]; then
  echo "Base '$POSTGRES_DB' absente, création en cours..."
  docker compose --env-file "$ENV_FILE" exec -T db \
    psql -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE \"$POSTGRES_DB\";" >/dev/null
  echo "Base '$POSTGRES_DB' créée."
fi

echo "Initialisation du schéma uniquement (pas d'import de données)."

echo "Deploiement terminé."
