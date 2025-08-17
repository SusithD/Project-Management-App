#!/bin/bash

# Demo Environment Setup Script
# This script helps set up the demo environment for the Project Management App

echo "🚀 Project Management App - Demo Environment Setup"
echo "=================================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env 2>/dev/null || echo "DEMO_MODE=true" > .env
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

# Check if DEMO_MODE is set
if grep -q "DEMO_MODE=true" .env; then
    echo "✅ Demo mode is enabled"
else
    echo "⚠️  Demo mode is not enabled. Adding DEMO_MODE=true to .env..."
    echo "DEMO_MODE=true" >> .env
    echo "✅ Demo mode enabled"
fi

# Check if MongoDB is running (basic check)
echo "🔍 Checking MongoDB connection..."
if command -v mongod &> /dev/null; then
    if pgrep -x "mongod" > /dev/null; then
        echo "✅ MongoDB is running"
    else
        echo "⚠️  MongoDB is not running. Please start MongoDB before continuing."
        echo "   You can start it with: brew services start mongodb-community (macOS)"
        echo "   or: sudo systemctl start mongod (Linux)"
    fi
else
    echo "⚠️  MongoDB is not installed. Please install MongoDB first."
fi

# Check Node.js and npm
echo "🔍 Checking Node.js and npm..."
if command -v node &> /dev/null && command -v npm &> /dev/null; then
    echo "✅ Node.js and npm are installed"
    echo "   Node.js version: $(node --version)"
    echo "   npm version: $(npm --version)"
else
    echo "❌ Node.js or npm is not installed. Please install them first."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "🎉 Demo environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Start the development server: npm run dev"
echo "2. Open your browser to: http://localhost:3000/demo-login"
echo "3. Select a demo user to explore the platform"
echo ""
echo "Demo users available:"
echo "  • Super Admin: sarah.johnson@demo.com"
echo "  • Manager: michael.chen@demo.com"
echo "  • Business Analyst: emily.rodriguez@demo.com"
echo "  • Developer: alex.thompson@demo.com"
echo "  • Designer: david.kim@demo.com"
echo "  • HR: lisa.wang@demo.com"
echo ""
echo "For more information, see DEMO_SETUP.md"
