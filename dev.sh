#!/bin/bash

# Terminal colors
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create required data directories
function create_data_dirs {
  echo -e "${BLUE}Ensuring data directories exist...${NC}"
  mkdir -p packages_ts/core/dataplex/data/{postgres,neo4j,redis}
  mkdir -p seed_csv
  echo -e "${GREEN}Data directories ready${NC}"
}

# Display usage information
function show_help {
  echo -e "${BLUE}Relica Development Environment Helper${NC}"
  echo ""
  echo "Usage: ./dev.sh [command] [services...]"
  echo ""
  echo "Commands:"
  echo "  start       Start development environment (all or specified services)"
  echo "  stop        Stop development environment (all or specified services)"
  echo "  restart     Restart development environment (all or specified services)"
  echo "  status      Show status of running containers"
  echo "  logs        Show logs for running services"
  echo "  help        Display this help message"
  echo ""
  echo "Services:"
  echo "  If no services are specified, all services will be affected."
  echo "  Available services: redis postgres neo4j prism archivist clarity aperture portal nous shutter viewfinder"
  echo ""
  echo "Examples:"
  echo "  ./dev.sh start                 # Start all services"
  echo "  ./dev.sh start redis postgres  # Start only Redis and Postgres"
  echo "  ./dev.sh stop                  # Stop all services"
  echo "  ./dev.sh logs archivist        # Show logs for archivist"
  echo ""
}

# Check if docker-compose.dev.yml exists
if [ ! -f docker-compose.dev.yml ]; then
  echo -e "${RED}Error: docker-compose.dev.yml not found${NC}"
  exit 1
fi

# Ensure the script is executable
if [ ! -x "$(command -v "$0")" ]; then
  chmod +x "$0"
fi

# Get the command
cmd=$1
shift

# Process the command
case $cmd in
  start)
    if [ $# -eq 0 ]; then
      echo -e "${YELLOW}Starting all development services...${NC}"
      create_data_dirs
      docker-compose -f docker-compose.dev.yml up -d
    else
      echo -e "${YELLOW}Starting services: $@${NC}"
      create_data_dirs
      docker-compose -f docker-compose.dev.yml up -d "$@"
    fi
    ;;
  
  stop)
    if [ $# -eq 0 ]; then
      echo -e "${YELLOW}Stopping all development services...${NC}"
      docker-compose -f docker-compose.dev.yml down
    else
      echo -e "${YELLOW}Stopping services: $@${NC}"
      docker-compose -f docker-compose.dev.yml stop "$@"
    fi
    ;;
  
  restart)
    if [ $# -eq 0 ]; then
      echo -e "${YELLOW}Restarting all development services...${NC}"
      docker-compose -f docker-compose.dev.yml down
      create_data_dirs
      docker-compose -f docker-compose.dev.yml up -d
    else
      echo -e "${YELLOW}Restarting services: $@${NC}"
      docker-compose -f docker-compose.dev.yml restart "$@"
    fi
    ;;
  
  status)
    echo -e "${YELLOW}Development service status:${NC}"
    docker-compose -f docker-compose.dev.yml ps
    ;;
  
  logs)
    if [ $# -eq 0 ]; then
      echo -e "${YELLOW}Showing logs for all services...${NC}"
      docker-compose -f docker-compose.dev.yml logs -f
    else
      echo -e "${YELLOW}Showing logs for services: $@${NC}"
      docker-compose -f docker-compose.dev.yml logs -f "$@"
    fi
    ;;
  
  help|*)
    show_help
    ;;
esac