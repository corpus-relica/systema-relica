#!/bin/bash

# Test script for PM2-based architecture
# This script validates that all services are running and responding correctly

set -e

echo "🚀 Testing PM2-based Systema Relica Architecture"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a service is responding
check_service() {
    local service_name=$1
    local port=$2
    local endpoint=${3:-"/health"}
    
    echo -n "Checking $service_name (port $port)... "
    
    if curl -s -f "http://localhost:$port$endpoint" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        return 1
    fi
}

# Function to check PM2 process status
check_pm2_processes() {
    echo "🔍 Checking PM2 process status..."
    
    if docker exec systema-relica-backend pm2 list --no-color 2>/dev/null; then
        echo -e "${GREEN}✓ PM2 processes listed successfully${NC}"
    else
        echo -e "${RED}✗ Failed to list PM2 processes${NC}"
        return 1
    fi
}

# Function to check container health
check_container_health() {
    echo "🏥 Checking container health..."
    
    if docker ps | grep -q "systema-relica-backend"; then
        echo -e "${GREEN}✓ Backend container is running${NC}"
    else
        echo -e "${RED}✗ Backend container is not running${NC}"
        return 1
    fi
    
    if docker ps | grep -q "knowledge-integrator"; then
        echo -e "${GREEN}✓ Frontend container is running${NC}"
    else
        echo -e "${RED}✗ Frontend container is not running${NC}"
        return 1
    fi
}

# Main test execution
main() {
    echo "Starting architecture validation tests..."
    echo
    
    # Check if containers are running
    if ! check_container_health; then
        echo -e "${RED}❌ Container health check failed${NC}"
        exit 1
    fi
    
    echo
    
    # Check PM2 processes
    if ! check_pm2_processes; then
        echo -e "${RED}❌ PM2 process check failed${NC}"
        exit 1
    fi
    
    echo
    echo "🌐 Testing service endpoints..."
    
    # Test each service endpoint
    failed_services=0
    
    check_service "Portal" "2204" || ((failed_services++))
    check_service "Archivist" "3000" || ((failed_services++))
    check_service "Clarity" "3001" || ((failed_services++))
    check_service "Aperture" "3002" || ((failed_services++))
    check_service "Shutter" "3004" || ((failed_services++))
    check_service "Prism" "3005" || ((failed_services++))
    check_service "NOUS" "3006" "/" || ((failed_services++))  # NOUS might not have /health
    
    echo
    echo "📊 Testing frontend..."
    check_service "Knowledge Integrator" "5173" "/" || ((failed_services++))
    
    echo
    echo "🔗 Testing database connections..."
    check_service "PostgreSQL" "5432" "" || echo -e "${YELLOW}⚠ PostgreSQL check skipped (no HTTP endpoint)${NC}"
    check_service "Redis" "6379" "" || echo -e "${YELLOW}⚠ Redis check skipped (no HTTP endpoint)${NC}"
    check_service "Neo4j" "7474" "" || echo -e "${YELLOW}⚠ Neo4j web interface check skipped${NC}"
    
    echo
    echo "📋 Test Summary"
    echo "==============="
    
    if [ $failed_services -eq 0 ]; then
        echo -e "${GREEN}✅ All tests passed! PM2 architecture is working correctly.${NC}"
        echo
        echo "🎯 Next steps:"
        echo "- Test WebSocket connections between services"
        echo "- Verify real-time updates in the frontend"
        echo "- Run integration tests"
        exit 0
    else
        echo -e "${RED}❌ $failed_services service(s) failed health checks.${NC}"
        echo
        echo "🔧 Troubleshooting:"
        echo "- Check PM2 logs: docker exec systema-relica-backend pm2 logs"
        echo "- Check container logs: docker-compose -f docker-compose.pm2.yml logs backend"
        echo "- Restart failed services: docker exec systema-relica-backend pm2 restart <service-name>"
        exit 1
    fi
}

# Check if required tools are available
if ! command -v curl &> /dev/null; then
    echo -e "${RED}❌ curl is required but not installed${NC}"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ docker is required but not installed${NC}"
    exit 1
fi

# Run main test function
main "$@"