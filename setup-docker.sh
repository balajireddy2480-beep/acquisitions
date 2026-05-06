#!/usr/bin/env sh
set -eu

MODE="${1:-dev}"
COMPOSE="${COMPOSE:-docker compose}"

ensure_env_file() {
  target="$1"
  example="$2"

  if [ -f "$target" ]; then
    return 0
  fi

  if [ ! -f "$example" ]; then
    echo "Missing $target and $example." >&2
    exit 1
  fi

  cp "$example" "$target"
  echo "Created $target from $example. Fill in required secrets before continuing."
}

case "$MODE" in
  dev | development | up)
    ensure_env_file ".env.development" ".env.development.example"
    echo "Starting development stack with Neon Local."
    $COMPOSE -f docker-compose.dev.yml up --build
    ;;

  prod | production)
    ensure_env_file ".env.production" ".env.production.example"
    echo "Starting production app container with Neon Cloud DATABASE_URL."
    $COMPOSE -f docker-compose.prod.yml up --build -d
    ;;

  migrate:prod | prod:migrate | migrate)
    ensure_env_file ".env.production" ".env.production.example"
    echo "Running production migrations against Neon Cloud DATABASE_URL."
    $COMPOSE -f docker-compose.prod.yml --profile migrate run --rm migrate
    ;;

  down)
    echo "Stopping development stack."
    $COMPOSE -f docker-compose.dev.yml down
    ;;

  logs)
    $COMPOSE -f docker-compose.dev.yml logs -f app neon-local
    ;;

  *)
    cat <<'USAGE'
Usage: bash ./setup-docker.sh [dev|prod|migrate:prod|down|logs]

Examples:
  npm run docker
  npm run run:docker
  npm run docker:dev
  npm run docker:prod
  npm run docker:migrate:prod
  npm run docker:down
  npm run docker:logs
USAGE
    exit 1
    ;;
esac
