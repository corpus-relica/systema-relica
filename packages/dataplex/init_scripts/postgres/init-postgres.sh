#!/bin/bash

set -e

# Start the PostgreSQL server in the background
docker-entrypoint.sh postgres &

# Wait for the PostgreSQL server to be ready
until pg_isready -U postgres; do
  echo "Waiting for PostgreSQL to be ready..."
  sleep 1
done

echo "PostgreSQL is ready"

# Execute the SQL script to initialize the database
PGPASSWORD=$POSTGRES_PASSWORD psql -h localhost -U $POSTGRES_USER -d $POSTGRES_DB -f /docker-entrypoint-initdb.d/init.sql

echo "Database initialization completed"

# Keep the container running
tail -f /dev/null
