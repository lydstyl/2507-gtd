#!/bin/bash

# GTD App Port Cleanup Script
# Kills processes using ports 3000 and 5173

echo "🧹 GTD App Port Cleanup"
echo "======================="
echo ""

# Check what's using the ports
echo "📍 Checking ports 3000 and 5173..."
PORT_3000=$(lsof -ti :3000 2>/dev/null)
PORT_5173=$(lsof -ti :5173 2>/dev/null)

if [ -z "$PORT_3000" ] && [ -z "$PORT_5173" ]; then
    echo "✓ Ports are already free!"
    exit 0
fi

# Show what's using the ports
if [ -n "$PORT_3000" ]; then
    echo "❌ Port 3000 in use by process(es): $PORT_3000"
fi

if [ -n "$PORT_5173" ]; then
    echo "❌ Port 5173 in use by process(es): $PORT_5173"
fi

echo ""
echo "🔨 Killing processes..."

# Kill processes on port 3000
if [ -n "$PORT_3000" ]; then
    kill -9 $PORT_3000 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✓ Killed process(es) on port 3000"
    else
        echo "⚠️  Could not kill process on port 3000 (may need sudo)"
    fi
fi

# Kill processes on port 5173
if [ -n "$PORT_5173" ]; then
    kill -9 $PORT_5173 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✓ Killed process(es) on port 5173"
    else
        echo "⚠️  Could not kill process on port 5173 (may need sudo)"
    fi
fi

# Also kill nodemon and vite processes just to be sure
echo ""
echo "🧹 Cleaning up related processes..."
pkill -f "nodemon.*server.ts" 2>/dev/null && echo "✓ Killed nodemon processes" || true
pkill -f "vite.*5173" 2>/dev/null && echo "✓ Killed vite processes" || true

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "You can now run: npm run dev"
