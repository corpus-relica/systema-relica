#!/bin/bash

# =============================================================================
# START PORTAL SERVICE LOCALLY
# =============================================================================
# Starts the Portal gateway service on port 2204 with local environment configuration

echo "🌐 Starting Portal gateway service locally..."
echo ""

# Check if core services are available
services=("archivist:3000" "clarity:3001" "aperture:3002")
for service_info in "${services[@]}"; do
  service_name=$(echo $service_info | cut -d: -f1)
  service_port=$(echo $service_info | cut -d: -f2)
  
  if ! curl -s http://localhost:$service_port > /dev/null 2>&1; then
    echo "⚠️  $service_name service not available on http://localhost:$service_port"
    echo "   Portal will work but some routes may fail until services are started."
  fi
done
echo ""

# Navigate to portal directory
cd packages/portal

# Set service-specific environment variables
export PORT=2204
export NODE_ENV=development

# Service endpoint configuration
export ARCHIVIST_URL=http://localhost:3000
export CLARITY_URL=http://localhost:3001
export APERTURE_URL=http://localhost:3002
export SHUTTER_URL=http://localhost:3004
export PRISM_URL=http://localhost:3005
export NOUS_URL=http://localhost:3006

echo "🚀 Starting Portal on http://localhost:2204"
echo "🔗 Routing to local services:"
echo "   📂 Archivist: http://localhost:3000"
echo "   🧠 Clarity: http://localhost:3001"
echo "   🔭 Aperture: http://localhost:3002"
echo "   🛡️  Shutter: http://localhost:3004"
echo "   🔮 Prism: http://localhost:3005"
echo "   🤖 NOUS: http://localhost:3006"
echo ""

# Start the service
yarn start:dev