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

# Database Layer
check_container "postgres" "PostgreSQL Database" "5432"
check_container "neo4j" "Neo4j Database" "7687/7474"
check_container "redis" "Redis Cache" "6379"

# Application Layer (PM2 Architecture)
check_container "systema-relica-backend" "Backend Services (PM2)" "2204,3000-3006"
check_container "knowledge-integrator" "Knowledge Integrator UI" "5173"

echo ""
echo "🔗 Quick Service URLs:"
echo "----------------------"
echo "Portal API:           http://localhost:2204"
echo "Knowledge Integrator: http://localhost:5173"
echo "Neo4j Browser:        http://localhost:7474"
echo ""
echo "Backend Services (via Portal):"
echo "Archivist:            http://localhost:3000"
echo "Clarity:              http://localhost:3001"
echo "Aperture:             http://localhost:3002"
echo "Shutter:              http://localhost:3004"
echo "Prism:                http://localhost:3005"
echo "NOUS:                 http://localhost:3006"

echo ""
echo "📋 Container Overview:"
echo "----------------------"

# Show running containers
if docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(systema-relica|postgres|neo4j|redis|knowledge-integrator)" | head -1 >/dev/null; then
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(systema-relica|postgres|neo4j|redis|knowledge-integrator)"
else
    echo "No Systema Relica containers are currently running"
fi

echo ""
echo "💾 Resource Usage:"
echo "------------------"

# Show resource usage if available
if command -v docker stats --no-stream >/dev/null 2>&1; then
    echo "Container resource usage (snapshot):"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep -E "(systema-relica|postgres|neo4j|redis|knowledge-integrator)" | head -10
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
echo "PM2 Commands:"
echo "View backend logs:   docker logs -f systema-relica-backend"
echo "PM2 status:          docker exec systema-relica-backend pm2 status"
echo "PM2 logs:            docker exec systema-relica-backend pm2 logs"
echo ""
echo "Database Commands:"
echo "Connect to database: docker exec -it postgres psql -U postgres"
echo "Connect to Neo4j:    docker exec -it neo4j cypher-shell"