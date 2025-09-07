#!/bin/bash

# Cleanup script for chat demo ports
# Kills any processes running on the ports used by the chat demo

echo "🧹 Cleaning up chat demo ports..."

# Kill processes on chat demo ports
PORTS=(3000 3001 3002 3003)

for port in "${PORTS[@]}"; do
    echo "Checking port $port..."
    PIDS=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$PIDS" ]; then
        echo "  Killing processes on port $port: $PIDS"
        echo $PIDS | xargs kill -9 2>/dev/null || true
        sleep 1
    else
        echo "  Port $port is free"
    fi
done

# Also kill any remaining chat-server, vite, or concurrently processes
echo "Killing any remaining chat demo processes..."
pkill -f "chat-server" 2>/dev/null || true
pkill -f "vite.*chat" 2>/dev/null || true
pkill -f "concurrently.*chat" 2>/dev/null || true
sleep 1

echo "✅ Port cleanup completed"
