#!/bin/bash

# =============================================================================
# START ALL SERVICES FOR DEVELOPMENT
# =============================================================================
# Starts the full Systema Relica stack using PM2 backend container + frontend
# Choice between full Docker setup or hybrid (Docker backend + local frontend)

echo "🚀 Starting full Systema Relica stack..."
echo ""

# Function to show usage
show_usage() {
    echo "Usage: $0 [MODE]"
    echo ""
    echo "Modes:"
    echo "  docker    - Full Docker setup (backend + frontend + databases)"
    echo "  hybrid    - Docker backend + local frontend development"
    echo "  local     - Frontend only (assumes backend container is running)"
    echo ""
    echo "Default: hybrid"
}

# Parse arguments
MODE="hybrid"
if [ $# -gt 0 ]; then
    case $1 in
        docker|hybrid|local)
            MODE=$1
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            echo "❌ Unknown mode: $1"
            show_usage
            exit 1
            ;;
    esac
fi

echo "🎯 Starting in $MODE mode..."
echo ""

case $MODE in
    docker)
        echo "🐳 Starting full Docker stack..."
        echo "================================"
        
        # Start all containers
        docker-compose up -d
        
        echo ""
        echo "⏳ Waiting for services to be ready..."
        sleep 10
        
        echo ""
        echo "🎉 Full Docker stack started!"
        echo ""
        echo "📊 Service URLs:"
        echo "   🌐 Portal API: http://localhost:2204"
        echo "   🎨 Knowledge Integrator: http://localhost:5173"
        echo "   🔗 Neo4j Browser: http://localhost:7474"
        echo ""
        echo "🛠️  Management:"
        echo "   📋 Check status: ./scripts/docker-status.sh"
        echo "   📝 View logs: ./scripts/docker-logs.sh"
        echo "   🛑 Stop all: docker-compose down"
        ;;
        
    hybrid)
        echo "🔄 Starting hybrid development setup..."
        echo "======================================"
        
        # Start databases first
        echo "📦 Starting databases..."
        ./scripts/start-databases.sh
        
        # Wait for databases
        sleep 5
        
        # Start backend container
        echo ""
        echo "🖥️  Starting PM2 backend container..."
        docker-compose up -d backend
        
        # Wait for backend to be ready
        echo "⏳ Waiting for backend services to start..."
        sleep 15
        
        # Start frontend locally
        echo ""
        echo "🎨 Starting Knowledge Integrator locally..."
        ./scripts/start-knowledge-integrator.sh &
        
        echo ""
        echo "🎉 Hybrid development stack started!"
        echo ""
        echo "📊 Service URLs:"
        echo "   🌐 Portal API: http://localhost:2204"
        echo "   🎨 Knowledge Integrator: http://localhost:5173"
        echo "   🔗 Neo4j Browser: http://localhost:7474"
        echo ""
        echo "🖥️  Backend Services (in container):"
        echo "   🗂️  Archivist: http://localhost:3000"
        echo "   🧠 Clarity: http://localhost:3001"
        echo "   🔭 Aperture: http://localhost:3002"
        echo "   🛡️  Shutter: http://localhost:3004"
        echo "   🔮 Prism: http://localhost:3005"
        echo "   🤖 NOUS: http://localhost:3006"
        echo ""
        echo "🛠️  Management:"
        echo "   📋 Backend logs: docker logs -f systema-relica-backend"
        echo "   📋 Check status: ./scripts/docker-status.sh"
        echo "   🛑 Stop backend: docker-compose stop backend"
        echo "   🛑 Stop all: docker-compose down"
        ;;
        
    local)
        echo "🎨 Starting frontend for local development..."
        echo "==========================================="
        
        # Check if backend is running
        if ! docker ps | grep -q systema-relica-backend; then
            echo "❌ Backend container is not running!"
            echo "   Start with: docker-compose up -d backend"
            echo "   Or use: $0 hybrid"
            exit 1
        fi
        
        # Start frontend locally
        echo "🎨 Starting Knowledge Integrator..."
        ./scripts/start-knowledge-integrator.sh
        ;;
esac

echo ""
echo "📱 Database URLs:"
echo "   🐘 PostgreSQL: localhost:5432"
echo "   🔗 Neo4j: http://localhost:7474"
echo "   🔴 Redis: localhost:6379"