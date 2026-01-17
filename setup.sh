#!/bin/bash

clear
echo "=========================================="
echo "  ✈️  SkyLog v2.0 - Enhanced Setup"
echo "=========================================="
echo ""
echo "🎨 Modern Design | 🔍 Smart Search | 👤 User Auth"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo ""
    echo "Please install Node.js first:"
    echo "  macOS: brew install node"
    echo "  Or visit: https://nodejs.org/"
    echo ""
    exit 1
fi

echo "✅ Node.js $(node --version) detected"
echo "✅ npm $(npm --version) detected"
echo ""

# Check if already installed
if [ -d "node_modules" ]; then
    echo "📦 Dependencies already installed"
    echo ""
    read -p "Do you want to reinstall? (y/N): " reinstall
    if [[ $reinstall =~ ^[Yy]$ ]]; then
        echo "🗑️  Removing old dependencies..."
        rm -rf node_modules package-lock.json
    else
        echo "⏭️  Skipping installation"
        echo ""
        echo "🚀 Starting SkyLog..."
        echo "   Opening http://localhost:3000"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "  What's New in v2.0:"
        echo "  • Modern glassmorphism design"
        echo "  • Smart airport search (60+ airports)"
        echo "  • User authentication system"
        echo "  • Enhanced statistics dashboard"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "Press Ctrl+C to stop the server"
        echo ""
        npm start
        exit 0
    fi
fi

echo "📦 Installing dependencies..."
echo "   This may take 1-3 minutes..."
echo ""

npm install

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Setup complete!"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  🎉 Welcome to SkyLog v2.0!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "  New Features:"
    echo "  ✨ Contemporary luxury design"
    echo "  🔍 Search any airport by code/city/name"
    echo "  👤 User registration & authentication"
    echo "  📊 Enhanced statistics dashboard"
    echo "  🎨 Glassmorphism UI effects"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🚀 Starting SkyLog..."
    echo "   Opening http://localhost:3000"
    echo ""
    echo "   First time? Create an account to get started!"
    echo "   Press Ctrl+C to stop the server"
    echo ""
    sleep 2
    npm start
else
    echo ""
    echo "❌ Installation failed!"
    echo "   Check the error messages above"
    exit 1
fi
