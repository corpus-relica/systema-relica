#!/bin/bash

# =============================================================================
# START CLARITY SERVICE LOCALLY
# =============================================================================
# Starts the Clarity service on port 3001 with local environment configuration

echo "🧠 Starting Clarity service locally..."
echo ""

# Check if Archivist is available
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
  echo "⚠️  Archivist service not available on http://localhost:3000"
  echo "   Clarity will retry connection when needed."
  echo "   Start Archivist with: ./scripts/start-archivist.sh"
  echo ""
fi

# Navigate to clarity directory
cd packages/clarity

# Set service-specific environment variables
export PORT=3001
export NODE_ENV=development

# Fix Archivist connection settings
export ARCHIVIST_HOST=localhost
export ARCHIVIST_PORT=3000
export ARCHIVIST_URL=http://localhost:3000

echo "🚀 Starting Clarity on http://localhost:3001"
echo "🔗 Will connect to Archivist at http://localhost:3000"
echo "📊 Connected to databases on localhost"
echo ""

# Start the service
yarn start:dev