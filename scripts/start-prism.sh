#!/bin/bash

# =============================================================================
# START PRISM SERVICE LOCALLY
# =============================================================================
# Starts the Prism system management service on port 3005 with local environment configuration

echo "🔮 Starting Prism system management service locally..."
echo ""

# Navigate to prism directory
cd packages/prism

# Set service-specific environment variables
export PORT=3005
export NODE_ENV=development

# Database connection settings for Neo4j and Redis
export NEO4J_HOST=localhost
export NEO4J_PORT=7687
export NEO4J_USER=neo4j
export NEO4J_PASSWORD=password

export REDIS_URL=redis://localhost:6379
export REDIS_PASSWORD=redis

echo "🚀 Starting Prism on http://localhost:3005"
echo "🔗 Connected to Neo4j on localhost:7687"
echo "🔴 Connected to Redis on localhost:6379"
echo ""

# Start the service
yarn start:dev