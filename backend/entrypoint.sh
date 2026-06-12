#!/bin/sh
set -e
until pg_isready -h postgres -U resq -d resq_dev; do
  echo "Waiting for database..."
  sleep 2
done
goose -dir sql/migrations postgres "$DATABASE_URL" up
exec ./resq-server

