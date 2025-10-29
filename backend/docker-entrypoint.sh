#!/bin/sh
set -e

echo "Waiting for database to be ready..."
MAX_RETRIES=30
RETRY_COUNT=0

# Wait for database connection
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if echo "SELECT 1;" | npx prisma db execute --stdin 2>/dev/null; then
    break
  fi
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "Database is unavailable - attempt $RETRY_COUNT/$MAX_RETRIES"
  sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "Failed to connect to database after $MAX_RETRIES attempts"
  exit 1
fi

echo "Database is ready!"
echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting application..."
exec npm run start:prod
