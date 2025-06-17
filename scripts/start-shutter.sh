#!/bin/bash

# =============================================================================
# START SHUTTER SERVICE LOCALLY
# =============================================================================
# Starts the Shutter authentication service on port 3004 with local environment configuration

echo "🛡️  Starting Shutter authentication service locally..."
echo ""

# Navigate to shutter directory
cd packages/shutter

# Set service-specific environment variables
export PORT=3004
export NODE_ENV=development

# Database connection settings
export DB_HOST=localhost
export DB_PORT=5432
export DB_USERNAME=postgres
export DB_PASSWORD=password
export DB_DATABASE=postgres

# JWT configuration
export JWT_SECRET=your-secret-key-here-for-local-dev

echo "🚀 Starting Shutter on http://localhost:3004"
echo "📊 Connected to PostgreSQL on localhost:5432"
echo "🔐 JWT authentication enabled"
echo ""

# Start the service
yarn start:dev