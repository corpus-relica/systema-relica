#!/bin/bash

# =============================================================================
# DOCKER LOGS VIEWER
# =============================================================================
# Intelligent log viewer for Systema Relica Docker containers
# Supports following specific services or all services with color coding

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to display usage
show_usage() {
    echo "🔍 Systema Relica Docker Logs Viewer"
    echo "===================================="
    echo ""
    echo "Usage: $0 [OPTIONS] [SERVICE]"
    echo ""
    echo "Services:"
    echo "  postgres     - PostgreSQL database logs"
    echo "  neo4j        - Neo4j database logs"
    echo "  redis        - Redis cache logs"
    echo "  backend      - PM2 backend services logs"
    echo "  frontend     - Knowledge Integrator UI logs"
    echo "  all          - All services (default)"
    echo ""
    echo "Options:"
    echo "  -f, --follow     Follow log output (like tail -f)"
    echo "  -n, --lines N    Show last N lines (default: 50)"
    echo "  -t, --timestamps Show timestamps"
    echo "  -h, --help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                    # Show recent logs from all services"
    echo "  $0 -f backend        # Follow backend PM2 logs"
    echo "  $0 -n 100 postgres   # Show last 100 lines from postgres"
    echo "  $0 -f -t all         # Follow all logs with timestamps"
    echo ""
}

# Default values
SERVICE="all"
FOLLOW=false
LINES=50
TIMESTAMPS=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--follow)
            FOLLOW=true
            shift
            ;;
        -t|--timestamps)
            TIMESTAMPS=true
            shift
            ;;
        -n|--lines)
            LINES="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        postgres|neo4j|redis|backend|frontend|all)
            SERVICE="$1"
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo ""
            show_usage
            exit 1
            ;;
    esac
done

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running or not accessible${NC}"
    exit 1
fi

# Map service names to container names
get_container_name() {
    case $1 in
        postgres) echo "postgres" ;;
        neo4j) echo "neo4j" ;;
        redis) echo "redis" ;;
        backend) echo "systema-relica-backend" ;;
        frontend) echo "knowledge-integrator" ;;
        *) echo "" ;;
    esac
}

# Function to show logs for a specific service
show_service_logs() {
    local service=$1
    local container_name=$(get_container_name "$service")
    
    if [ -z "$container_name" ]; then
        echo -e "${RED}❌ Unknown service: $service${NC}"
        return 1
    fi
    
    # Check if container exists and is running
    if ! docker ps --format "{{.Names}}" | grep -q "^$container_name$"; then
        echo -e "${YELLOW}⚠️  Container $container_name is not running${NC}"
        return 1
    fi
    
    # Build docker logs command
    local docker_cmd="docker logs"
    
    if [ "$FOLLOW" = true ]; then
        docker_cmd="$docker_cmd -f"
    fi
    
    if [ "$TIMESTAMPS" = true ]; then
        docker_cmd="$docker_cmd -t"
    fi
    
    docker_cmd="$docker_cmd --tail $LINES $container_name"
    
    echo -e "${GREEN}📋 Showing logs for $service ($container_name)${NC}"
    echo -e "${BLUE}Command: $docker_cmd${NC}"
    echo "----------------------------------------"
    
    # Execute the command
    eval "$docker_cmd" 2>&1 | while IFS= read -r line; do
        # Color code based on log level
        if echo "$line" | grep -qi "error\|fail\|exception"; then
            echo -e "${RED}$line${NC}"
        elif echo "$line" | grep -qi "warn"; then
            echo -e "${YELLOW}$line${NC}"
        elif echo "$line" | grep -qi "info\|start\|success"; then
            echo -e "${GREEN}$line${NC}"
        elif echo "$line" | grep -qi "debug"; then
            echo -e "${CYAN}$line${NC}"
        else
            echo "$line"
        fi
    done
}

# Function to show logs for all services
show_all_logs() {
    echo -e "${GREEN}📋 Showing logs for all Systema Relica services${NC}"
    echo "=============================================="
    
    # Get all running Systema Relica containers
    local containers=$(docker ps --format "{{.Names}}" | grep -E "(systema-relica|postgres|neo4j|redis|knowledge-integrator)" | sort)
    
    if [ -z "$containers" ]; then
        echo -e "${YELLOW}⚠️  No Systema Relica containers are currently running${NC}"
        return 1
    fi
    
    if [ "$FOLLOW" = true ]; then
        echo "Following logs from all services (press Ctrl+C to stop)..."
        echo ""
        
        # Build docker-compose logs command
        local compose_cmd="docker-compose logs -f"
        
        if [ "$TIMESTAMPS" = true ]; then
            compose_cmd="$compose_cmd -t"
        fi
        
        compose_cmd="$compose_cmd --tail $LINES"
        
        # Execute with color coding
        eval "$compose_cmd" 2>&1 | while IFS= read -r line; do
            # Extract service name and colorize
            if echo "$line" | grep -q "systema-relica-backend"; then
                if echo "$line" | grep -qi "error\|fail\|exception"; then
                    echo -e "${RED}[backend]${NC} ${RED}$line${NC}"
                elif echo "$line" | grep -qi "warn"; then
                    echo -e "${YELLOW}[backend]${NC} ${YELLOW}$line${NC}"
                elif echo "$line" | grep -qi "info\|start\|success"; then
                    echo -e "${GREEN}[backend]${NC} $line"
                else
                    echo -e "${BLUE}[backend]${NC} $line"
                fi
            elif echo "$line" | grep -q "knowledge-integrator"; then
                echo -e "${PURPLE}[frontend]${NC} $line"
            elif echo "$line" | grep -q "postgres\|neo4j\|redis"; then
                local service_part=$(echo "$line" | sed 's/.*\(postgres\|neo4j\|redis\).*/\1/')
                echo -e "${CYAN}[$service_part]${NC} $line"
            else
                echo "$line"
            fi
        done
    else
        # Show recent logs from each service
        echo -e "Recent logs (last $LINES lines from each service):"
        echo ""
        
        for container in $containers; do
            # Get friendly service name
            local service_name=""
            case $container in
                systema-relica-backend) service_name="backend (PM2)" ;;
                knowledge-integrator) service_name="frontend" ;;
                postgres) service_name="postgres" ;;
                neo4j) service_name="neo4j" ;;
                redis) service_name="redis" ;;
                *) service_name="$container" ;;
            esac
            
            echo -e "${PURPLE}=== $service_name ===${NC}"
            
            docker logs --tail 10 "$container" 2>&1 | while IFS= read -r line; do
                if echo "$line" | grep -qi "error\|fail\|exception"; then
                    echo -e "${RED}$line${NC}"
                elif echo "$line" | grep -qi "warn"; then
                    echo -e "${YELLOW}$line${NC}"
                else
                    echo "$line"
                fi
            done
            echo ""
        done
    fi
}

# Main execution
echo -e "${BLUE}🔍 Systema Relica Docker Logs${NC}"
echo "=============================="
echo ""

if [ "$SERVICE" = "all" ]; then
    show_all_logs
else
    show_service_logs "$SERVICE"
fi

echo ""
echo -e "${CYAN}💡 Tip: Use 'docker logs -f <container>' for live logs${NC}"
echo -e "${CYAN}   Or use 'yarn docker:logs' for the basic docker-compose logs${NC}"