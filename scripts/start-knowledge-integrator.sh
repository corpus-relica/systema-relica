#!/bin/bash

# =============================================================================
# START KNOWLEDGE INTEGRATOR (FRONTEND) LOCALLY
# =============================================================================
# Starts the Knowledge Integrator React frontend on port 5173 with local environment configuration

echo "🎨 Starting Knowledge Integrator frontend locally..."
echo ""

# Check if Portal is available
if ! curl -s http://localhost:2204 > /dev/null 2>&1; then
  echo "⚠️  Portal service not available on http://localhost:2204"
  echo "   Frontend will work but API calls will fail until Portal is started."
  echo "   Start Portal with: ./scripts/start-portal.sh"
  echo ""
fi

# Navigate to knowledge-integrator directory
cd packages/knowledge-integrator

# Set environment variables for Vite
export VITE_PORTAL_URL=http://localhost:2204
export VITE_NODE_ENV=development
export CHOKIDAR_USEPOLLING=true

echo "🚀 Starting Knowledge Integrator on http://localhost:5173"
echo "🔗 API calls will go to Portal at http://localhost:2204"
echo "🔥 Hot reloading enabled"
echo ""

# Start the frontend
yarn dev