#!/bin/bash

# Build the New Beginning MCP Server Docker Image
echo "🚀 Building nb-mcp-server..."

docker build -t nb-mcp-server:latest .

echo "✅ Build complete!"
echo "To add this to Docker Desktop MCP Gateway, use the following details:"
echo "Name: New Beginning MCP"
echo "Image: nb-mcp-server:latest"
