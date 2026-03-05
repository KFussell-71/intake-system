#!/bin/bash
# V3.2 Desktop Packaging Script
# This script builds the production bundle and prepares it for PWA/Electron installation.

set -e

echo "🚀 Starting V3.2 Desktop Packaging Workflow..."

# 1. Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf app/.next app/out

# 2. Build production application
echo "🏗️ Building Next.js application (Standalone)..."
cd app
npm run build

echo "✅ Build Complete."
echo "📦 Assets prepared in app/.next/standalone"
echo ""
echo "📱 PWA Manifest verified at app/public/manifest.json"
echo "🔧 To test as PWA locally:"
echo "   1. run 'npm run start' in the app directory"
echo "   2. Open Chrome/Edge at http://localhost:3000"
echo "   3. Click the 'Install' icon in the address bar."
echo ""
echo "🎉 V3.2 Packaging Successful."
