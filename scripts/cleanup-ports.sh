#!/bin/bash

# Global port cleanup script for SigmaSockets project
# Kills any processes running on ports used by the project

echo "🧹 Cleaning up SigmaSockets project ports..."

# Kill processes on all project ports
PORTS=(3000 3001 3002 3003 8080 8081 8082)

for port in "${PORTS[@]}"; do
    echo "Checking port $port..."
    PIDS=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$PIDS" ]; then
        echo "  Killing processes on port $port: $PIDS"
        echo $PIDS | xargs kill -9 2>/dev/null || true
    else
        echo "  Port $port is free"
    fi
done

echo "✅ Global port cleanup completed"
