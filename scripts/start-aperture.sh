#!/bin/bash

# =============================================================================
# START APERTURE SERVICE LOCALLY
# =============================================================================
# Starts the Aperture service on port 3002 with local environment configuration

echo "🔭 Starting Aperture service locally..."
echo ""

# Check if Archivist is available
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
  echo "⚠️  Archivist service not available on http://localhost:3000"
  echo "   Aperture will retry connection when needed."
  echo "   Start Archivist with: ./scripts/start-archivist.sh"
  echo ""
fi

# Navigate to aperture directory
cd packages/aperture

# Set service-specific environment variables
export PORT=3002
export NODE_ENV=development

# Database connection settings
export DB_HOST=localhost
export DB_PORT=5432
export DB_USERNAME=postgres
export DB_PASSWORD=password
export DB_DATABASE=postgres

# Archivist connection settings
export ARCHIVIST_HOST=localhost
export ARCHIVIST_URL=http://localhost:3000

echo "🚀 Starting Aperture on http://localhost:3002"
echo "🔗 Will connect to Archivist at http://localhost:3000"
echo "📊 Connected to PostgreSQL on localhost:5432"
echo ""

# Start the service
yarn start:dev