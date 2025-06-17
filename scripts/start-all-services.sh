#!/bin/bash

# =============================================================================
# START ALL SERVICES FOR LOCAL DEVELOPMENT
# =============================================================================
# Starts all services in the correct order for local CLI development
# Uses tmux to run each service in a separate pane for easy monitoring

echo "🚀 Starting full Systema Relica stack locally..."
echo ""

# Check if tmux is installed
if ! command -v tmux &> /dev/null; then
  echo "❌ tmux is required for running all services."
  echo "   Install with: brew install tmux (macOS) or apt-get install tmux (Ubuntu)"
  echo ""
  echo "Alternative: Start services manually in separate terminals:"
  echo "   ./scripts/start-databases.sh"
  echo "   ./scripts/start-archivist.sh"
  echo "   ./scripts/start-clarity.sh"
  echo "   ./scripts/start-aperture.sh"
  echo "   ./scripts/start-shutter.sh"
  echo "   ./scripts/start-prism.sh"
  echo "   ./scripts/start-portal.sh"
  echo "   ./scripts/start-nous.sh"
  echo "   ./scripts/start-knowledge-integrator.sh"
  exit 1
fi

# Start databases first
echo "📦 Starting databases..."
./scripts/start-databases.sh

# Wait a moment for databases to be ready
sleep 5

# Create tmux session for services
SESSION_NAME="systema-relica"

# Kill existing session if it exists
tmux kill-session -t $SESSION_NAME 2>/dev/null || true

# Create new session
tmux new-session -d -s $SESSION_NAME -n "services"

# Split into multiple panes
tmux split-window -h
tmux split-window -v
tmux select-pane -t 0
tmux split-window -v
tmux select-pane -t 2  
tmux split-window -h
tmux select-pane -t 4
tmux split-window -h

# Start services in each pane with proper timing
echo "🗂️  Starting Archivist..."
tmux send-keys -t $SESSION_NAME:0.0 './scripts/start-archivist.sh' Enter

sleep 3

echo "🧠 Starting Clarity..."
tmux send-keys -t $SESSION_NAME:0.1 './scripts/start-clarity.sh' Enter

echo "🔭 Starting Aperture..."
tmux send-keys -t $SESSION_NAME:0.2 './scripts/start-aperture.sh' Enter

echo "🛡️  Starting Shutter..."
tmux send-keys -t $SESSION_NAME:0.3 './scripts/start-shutter.sh' Enter

echo "🔮 Starting Prism..."
tmux send-keys -t $SESSION_NAME:0.4 './scripts/start-prism.sh' Enter

sleep 3

echo "🌐 Starting Portal..."
tmux send-keys -t $SESSION_NAME:0.5 './scripts/start-portal.sh' Enter

# Add additional panes for NOUS and frontend
tmux new-window -t $SESSION_NAME -n "ai-frontend"
tmux split-window -h

sleep 2

echo "🤖 Starting NOUS..."
tmux send-keys -t $SESSION_NAME:1.0 './scripts/start-nous.sh' Enter

sleep 2

echo "🎨 Starting Knowledge Integrator..."
tmux send-keys -t $SESSION_NAME:1.1 './scripts/start-knowledge-integrator.sh' Enter

echo ""
echo "🎉 All services starting!"
echo ""
echo "📊 Service URLs:"
echo "   🗂️  Archivist: http://localhost:3000"
echo "   🧠 Clarity: http://localhost:3001"
echo "   🔭 Aperture: http://localhost:3002"
echo "   🛡️  Shutter: http://localhost:3004"
echo "   🔮 Prism: http://localhost:3005"
echo "   🤖 NOUS: http://localhost:3006"
echo "   🌐 Portal: http://localhost:2204"
echo "   🎨 Knowledge Integrator: http://localhost:5173"
echo ""
echo "📱 Database URLs:"
echo "   🐘 PostgreSQL: localhost:5432"
echo "   🔗 Neo4j: http://localhost:7474"
echo "   🔴 Redis: localhost:6379"
echo ""
echo "🖥️  Attach to tmux session: tmux attach-session -t $SESSION_NAME"
echo "🛑 Stop all services: tmux kill-session -t $SESSION_NAME"