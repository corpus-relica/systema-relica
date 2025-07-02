#!/bin/bash

# =============================================================================
# DOCKER STATUS CHECKER
# =============================================================================
# Quickly check the health and status of all Systema Relica Docker containers
# Provides formatted output showing which services are running and their health

echo "🐳 Systema Relica Docker Status"
echo "================================"
echo ""

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running or not accessible"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed"
    exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check container status
check_container() {
    local container_name=$1
    local display_name=$2
    local port=$3
    
    if docker ps --format "table {{.Names}}" | grep -q "$container_name"; then
        # Container is running, check if it's healthy
        local health=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null)
        local status=$(docker inspect --format='{{.State.Status}}' "$container_name" 2>/dev/null)
        
        if [ "$status" = "running" ]; then
            if [ "$health" = "healthy" ]; then
                echo -e "${GREEN}✅ $display_name${NC} - Running & Healthy (Port: $port)"
            elif [ "$health" = "unhealthy" ]; then
                echo -e "${RED}❌ $display_name${NC} - Running but Unhealthy (Port: $port)"
            elif [ "$health" = "starting" ]; then
                echo -e "${YELLOW}🔄 $display_name${NC} - Starting up... (Port: $port)"
            else
                echo -e "${GREEN}✅ $display_name${NC} - Running (Port: $port)"
            fi
        else
            echo -e "${RED}❌ $display_name${NC} - Not running properly"
        fi
    else
        echo -e "${RED}❌ $display_name${NC} - Not running"
    fi
}

# Check each service
echo "📊 Service Status:"
echo "-------------------"

check_container "systema-relica-postgres" "PostgreSQL Database" "5432"
check_container "systema-relica-neo4j" "Neo4j Database" "7687/7474"
check_container "systema-relica-redis" "Redis Cache" "6379"
check_container "systema-relica-archivist" "Archivist Service" "3000"
check_container "systema-relica-clarity" "Clarity Service" "3001"
check_container "systema-relica-aperture" "Aperture Service" "3002"
check_container "systema-relica-shutter" "Shutter Service" "3004"
check_container "systema-relica-prism" "Prism Service" "3005"
check_container "systema-relica-nous" "NOUS AI Service" "3006"
check_container "systema-relica-portal" "Portal Gateway" "2204"
check_container "systema-relica-knowledge-integrator" "Knowledge Integrator UI" "5173"

echo ""
echo "🔗 Quick Service URLs:"
echo "----------------------"
echo "Portal API:           http://localhost:2204"
echo "Knowledge Integrator: http://localhost:5173"
echo "Neo4j Browser:        http://localhost:7474"
echo "Archivist API:        http://localhost:3000"
echo "Prism API:            http://localhost:3005"

echo ""
echo "📋 Container Overview:"
echo "----------------------"

# Show running containers
if docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep systema-relica | head -1 >/dev/null; then
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep systema-relica
else
    echo "No Systema Relica containers are currently running"
fi

echo ""
echo "💾 Resource Usage:"
echo "------------------"

# Show resource usage if available
if command -v docker stats --no-stream >/dev/null 2>&1; then
    echo "Container resource usage (snapshot):"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep systema-relica | head -10
else
    echo "Docker stats not available"
fi

echo ""
echo "🛠️  Common Commands:"
echo "-------------------"
echo "Start all services:  yarn docker:up"
echo "Stop all services:   yarn docker:down"
echo "View logs:           yarn docker:logs"
echo "Rebuild and start:   yarn docker:build"
echo ""
echo "View specific logs:  docker logs systema-relica-<service>"
echo "Connect to database: docker exec -it systema-relica-postgres psql -U postgres"
echo "Connect to Neo4j:    docker exec -it systema-relica-neo4j cypher-shell"