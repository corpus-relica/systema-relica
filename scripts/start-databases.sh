#!/bin/bash

# =============================================================================
# START DATABASES FOR LOCAL DEVELOPMENT
# =============================================================================
# Starts only the database services (PostgreSQL, Neo4j, Redis) in containers
# while keeping all application services available to run locally via CLI.

echo "🗄️  Starting database services in Docker..."
echo ""

# Start only the database services
docker-compose up -d postgres neo4j redis

echo ""
echo "⏳ Waiting for databases to be ready..."

# Wait for PostgreSQL
echo "🐘 Waiting for PostgreSQL..."
until docker exec postgres pg_isready -U postgres > /dev/null 2>&1; do
  echo "   PostgreSQL is starting up..."
  sleep 2
done
echo "✅ PostgreSQL is ready"

# Wait for Neo4j
echo "🔗 Waiting for Neo4j..."
until curl -s http://localhost:7474 > /dev/null 2>&1; do
  echo "   Neo4j is starting up..."
  sleep 2
done
echo "✅ Neo4j is ready"

# Wait for Redis
echo "🔴 Waiting for Redis..."
until docker exec redis redis-cli ping > /dev/null 2>&1; do
  echo "   Redis is starting up..."
  sleep 2
done
echo "✅ Redis is ready"

echo ""
echo "🎉 All databases are ready for local development!"
echo ""
echo "Database endpoints:"
echo "  📊 PostgreSQL: localhost:5432"
echo "  🔗 Neo4j HTTP: http://localhost:7474"
echo "  🔗 Neo4j Bolt: bolt://localhost:7687"
echo "  🔴 Redis: localhost:6379"
echo ""
echo "Now you can start individual services with:"
echo "  ./scripts/start-archivist.sh"
echo "  ./scripts/start-clarity.sh"
echo "  ./scripts/start-aperture.sh"
echo "  etc..."