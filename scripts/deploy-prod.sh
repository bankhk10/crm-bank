#!/bin/bash

# Production Deployment Script for CRM Bank Application
# This script deploys the application to production using Docker

set -e

echo "=========================================="
echo "CRM Bank - Production Deployment"
echo "=========================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ Error: .env.production file not found!"
    echo "Please create .env.production with your production configuration."
    echo "You can use .env.production.example as a template."
    exit 1
fi

echo "✅ Production environment file found"
echo ""

# Backup current deployment (if exists)
echo "💾 Creating backup of current deployment..."
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo "Backing up current containers..."
    docker-compose -f docker-compose.prod.yml logs > "$BACKUP_DIR/logs.txt" 2>&1 || true
fi

echo "✅ Backup created at $BACKUP_DIR"
echo ""

# Pull latest code (if using git)
if [ -d .git ]; then
    echo "📥 Pulling latest code from repository..."
    git pull
    echo "✅ Code updated"
    echo ""
fi

# Build new image
echo "🏗️  Building production Docker image..."
docker-compose -f docker-compose.prod.yml build --no-cache

echo ""
echo "🔄 Running database migrations..."
# Run migrations in a temporary container
docker-compose -f docker-compose.prod.yml run --rm app npx prisma migrate deploy

echo ""
echo "🚀 Deploying to production..."
# Stop old containers
docker-compose -f docker-compose.prod.yml down

# Start new containers
docker-compose -f docker-compose.prod.yml up -d

echo ""
echo "⏳ Waiting for application to start..."
sleep 15

# Health check
echo ""
echo "🏥 Performing health check..."
MAX_RETRIES=10
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker-compose -f docker-compose.prod.yml exec -T app curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "✅ Health check passed!"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "⏳ Waiting for application... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 5
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ Health check failed! Rolling back..."
    docker-compose -f docker-compose.prod.yml down
    echo "Please check logs: docker-compose -f docker-compose.prod.yml logs"
    exit 1
fi

# Show container status
echo ""
echo "📊 Container Status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "=========================================="
echo "✅ Production deployment successful!"
echo "=========================================="
echo ""
echo "📝 Useful commands:"
echo "  - View logs:        docker-compose -f docker-compose.prod.yml logs -f"
echo "  - Stop containers:  docker-compose -f docker-compose.prod.yml down"
echo "  - Restart:          docker-compose -f docker-compose.prod.yml restart"
echo ""
echo "🔍 To view real-time logs, run:"
echo "   docker-compose -f docker-compose.prod.yml logs -f app"
echo ""
