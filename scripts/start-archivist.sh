#!/bin/bash

# =============================================================================
# START ARCHIVIST SERVICE LOCALLY
# =============================================================================
# Starts the Archivist service on port 3000 with local environment configuration

echo "🗂️  Starting Archivist service locally..."
echo ""

# Check if databases are running
if ! docker ps | grep -q postgres; then
  echo "❌ PostgreSQL container not running. Start databases first:"
  echo "   ./scripts/start-databases.sh"
  exit 1
fi

if ! docker ps | grep -q neo4j; then
  echo "❌ Neo4j container not running. Start databases first:"
  echo "   ./scripts/start-databases.sh"
  exit 1
fi

if ! docker ps | grep -q redis; then
  echo "❌ Redis container not running. Start databases first:"
  echo "   ./scripts/start-databases.sh"
  exit 1
fi

# Navigate to archivist directory
cd packages/archivist

# Set service-specific environment variables
export PORT=3000
export NODE_ENV=development

echo "🚀 Starting Archivist on http://localhost:3000"
echo "📊 Connected to databases on localhost"
echo ""

# Start the service
yarn start:dev