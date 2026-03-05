#!/bin/bash
echo "🚀 Starting Intake System..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file missing. Please copy .env.example to .env and configure it."
    exit 1
fi

# Pull latest images
echo "⬇️  Pulling latest images..."
docker compose pull

# Start services
echo "🐳 Starting services..."
docker compose up -d

# Wait for Ollama to be ready
echo "⏳ Waiting for Ollama to initialize..."
sleep 5

# Pull the default model
echo "🧠 Pulling default AI model (gemma2:2b)..."
docker exec -it intake-ollama ollama pull gemma2:2b

echo ""
echo "✅ System is running!"
echo "👉 Access App: http://localhost:3000"
echo "👉 Logs: docker compose logs -f"
