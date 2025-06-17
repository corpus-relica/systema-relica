#!/bin/bash

# =============================================================================
# START NOUS SERVICE LOCALLY
# =============================================================================
# Starts the NOUS AI service on port 3006 with local environment configuration

echo "🤖 Starting NOUS AI service locally..."
echo ""

# Check if required services are available
services=("clarity:3001" "aperture:3002" "archivist:3000")
for service_info in "${services[@]}"; do
  service_name=$(echo $service_info | cut -d: -f1)
  service_port=$(echo $service_info | cut -d: -f2)
  
  if ! curl -s http://localhost:$service_port > /dev/null 2>&1; then
    echo "⚠️  $service_name service not available on http://localhost:$service_port"
    echo "   NOUS may not function properly until this service is started."
  fi
done
echo ""

# Navigate to nous directory
cd packages_py/nous

# Set service-specific environment variables
export NOUS_PORT=3006
export NODE_ENV=development
export PYTHONPATH=/home/marc/Documents/labs/systema-relica
export PYTHONUNBUFFERED=1

# Service endpoint configuration (local services)
export CLARITY_HOST=localhost
export CLARITY_PORT=3001
export APERTURE_HOST=localhost  
export APERTURE_PORT=3002
export ARCHIVIST_HOST=localhost
export ARCHIVIST_PORT=3000

# Load API keys from main .env
source ../../.env

echo "🚀 Starting NOUS on http://localhost:3006"
echo "🔗 Connecting to local services:"
echo "   🧠 Clarity: http://localhost:3001"
echo "   🔭 Aperture: http://localhost:3002"
echo "   📂 Archivist: http://localhost:3000"
echo "🤖 LLM APIs configured"
echo ""

# Start the service
python direct_socketio_main.py