#!/bin/bash

# SigmaSockets Chat Demo - Render.com Deployment Script
# This script prepares the project for deployment to Render.com

set -e

echo "🚀 Preparing SigmaSockets Chat Demo for Render.com deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "Dockerfile" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
npm run clean

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build packages
echo "🔨 Building packages..."
npm run build:packages

# Build chat demo
echo "🎨 Building chat demo (Vue.js client + Node.js server)..."
cd demos/chat
npm run build
cd ../..

# Verify build outputs
echo "✅ Verifying build outputs..."
if [ ! -f "demos/chat/dist/chat-server.js" ]; then
    echo "❌ Error: Server build failed - chat-server.js not found"
    exit 1
fi

if [ ! -f "demos/chat/dist/index.html" ]; then
    echo "❌ Error: Client build failed - index.html not found"
    exit 1
fi

if [ ! -d "demos/chat/dist/assets" ]; then
    echo "❌ Error: Client build failed - assets directory not found"
    exit 1
fi

echo "✅ Build verification successful!"

# Show build sizes
echo "📊 Build sizes:"
echo "Server: $(du -sh demos/chat/dist/chat-server.js | cut -f1)"
echo "Client assets: $(du -sh demos/chat/dist/assets | cut -f1)"
echo "Total dist: $(du -sh demos/chat/dist | cut -f1)"

# Test the server locally (optional)
if [ "$1" = "--test" ]; then
    echo "🧪 Testing server locally..."
    cd demos/chat
    timeout 10s npm run dev:server || echo "Server test completed"
    cd ../..
fi

echo ""
echo "🎉 Deployment preparation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Commit your changes: git add . && git commit -m 'Deploy Vue.js chat demo'"
echo "2. Push to GitHub: git push origin main"
echo "3. Render.com will automatically deploy using the Dockerfile"
echo ""
echo "🔗 Your app will be available at: https://sigmasockets-chat.onrender.com"
echo "📊 Health check: https://sigmasockets-chat.onrender.com/health"
echo ""
echo "💡 To test locally: cd demos/chat && npm run dev:chat"
