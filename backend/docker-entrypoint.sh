#!/bin/sh
set -e

echo "Waiting for database to be ready..."
MAX_RETRIES=30
RETRY_COUNT=0

# Wait for database connection using a simple sleep approach
# Database should be ready within 60 seconds
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  # Try to run migrations - if it succeeds, database is ready
  if npx prisma migrate deploy 2>/dev/null; then
    echo "Database is ready and migrations applied!"
    break
  fi
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "Waiting for database - attempt $RETRY_COUNT/$MAX_RETRIES"
  sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "Failed to connect to database after $MAX_RETRIES attempts"
  exit 1
fi

echo "Starting application..."
exec npm run start:prod
