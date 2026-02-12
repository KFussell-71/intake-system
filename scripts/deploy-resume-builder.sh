#!/bin/bash

echo "🚀 Deploying Reactive Resume..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if .env.resume exists
if [ ! -f .env.resume ]; then
    echo "📝 Creating .env.resume from template..."
    cp .env.resume.example .env.resume
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env.resume and update the following:"
    echo "   - RESUME_SECRET_KEY (min 32 characters)"
    echo "   - JWT_SECRET"
    echo "   - CHROME_TOKEN"
    echo "   - POSTGRES_PASSWORD"
    echo "   - MINIO_SECRET_KEY"
    echo ""
    echo "Run this script again after updating .env.resume"
    exit 1
fi

# Load environment variables
export $(cat .env.resume | grep -v '^#' | xargs)

# Pull latest images
echo "📦 Pulling latest images..."
docker-compose -f docker-compose.resume.yml pull

# Start services
echo "🏗️  Starting services..."
docker-compose -f docker-compose.resume.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 15

# Check health
echo ""
echo "🔍 Checking service health..."
echo ""

# Check Resume App
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Resume App: Running"
else
    echo "⚠️  Resume App: Not ready yet (may take a few more seconds)"
fi

# Check MinIO
if curl -f http://localhost:9000/minio/health/live > /dev/null 2>&1; then
    echo "✅ MinIO Storage: Running"
else
    echo "⚠️  MinIO Storage: Not ready yet"
fi

# Check Printer
if curl -f http://localhost:8080/health > /dev/null 2>&1; then
    echo "✅ Printer Service: Running"
else
    echo "⚠️  Printer Service: Not ready yet"
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📍 Access Points:"
echo "   - Reactive Resume: http://localhost:3001"
echo "   - MinIO Console: http://localhost:9001"
echo "   - Printer Service: http://localhost:8080"
echo ""
echo "📝 Next Steps:"
echo "   1. Visit http://localhost:3001 to verify it's running"
echo "   2. Create an admin account (first user becomes admin)"
echo "   3. Generate an API key from the settings"
echo "   4. Add the API key to your .env file as RESUME_API_KEY"
echo ""
echo "🛑 To stop services: docker-compose -f docker-compose.resume.yml down"
echo "🗑️  To remove all data: docker-compose -f docker-compose.resume.yml down -v"
