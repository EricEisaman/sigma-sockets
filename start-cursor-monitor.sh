#!/bin/bash

# Simple Cursor Monitor Starter
# Run this script from any terminal to start monitoring Cursor and the SigmaSockets project

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Change to the project directory
cd "$SCRIPT_DIR"

# Make sure the monitor script is executable
chmod +x scripts/cursor-monitor.sh

# Start the monitor
echo "🚀 Starting Cursor Monitor for SigmaSockets project..."
echo "📁 Project directory: $SCRIPT_DIR"
echo "⏰ Will run improvement cycles every 5 minutes"
echo "🛑 Press Ctrl+C to stop"
echo ""

# Run the monitor script
exec ./scripts/cursor-monitor.sh
