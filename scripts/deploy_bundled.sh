#!/bin/bash
set -e

# Deployment Script for Intake System
# Usage: ./deploy_bundled.sh

echo "🚀 Starting Deployment..."

# 1. Check for Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker Desktop."
    exit 1
fi

# 2. Build Integration
echo "📦 Building Docker Images..."
docker compose build

# 3. Start Services
echo "🔥 Starting Services..."
docker compose up -d

# 4. Wait for Health
echo "Waiting for services to be healthy..."
sleep 10

# 5. Summary
echo "✅ Deployment Complete!"
echo "--------------------------------"
echo "Web App: http://localhost:3000"
echo "AI Service: http://localhost:11434"
echo "--------------------------------"
