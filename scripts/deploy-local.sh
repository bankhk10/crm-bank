#!/bin/bash

# Local Docker Testing Script for CRM Bank Application
# This script builds and runs the application locally with Docker

set -e

echo "=========================================="
echo "CRM Bank - Local Docker Testing"
echo "=========================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local file not found!"
    echo "Please create .env.local with your configuration."
    exit 1
fi

echo "✅ Environment file found"
echo ""

# Stop and remove existing containers
echo "🧹 Cleaning up existing containers..."
docker-compose down -v

echo ""
echo "🏗️  Building Docker images..."
docker-compose build --no-cache

echo ""
echo "🚀 Starting containers..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check container status
echo ""
echo "📊 Container Status:"
docker-compose ps

echo ""
echo "=========================================="
echo "✅ Local testing environment is ready!"
echo "=========================================="
echo ""
echo "📱 Application: http://localhost:3000"
echo "🗄️  Database: localhost:5432"
echo ""
echo "📝 Useful commands:"
echo "  - View logs:        docker-compose logs -f"
echo "  - View app logs:    docker-compose logs -f app"
echo "  - Stop containers:  docker-compose down"
echo "  - Restart:          docker-compose restart"
echo ""
echo "🔍 To view real-time logs, run:"
echo "   docker-compose logs -f app"
echo ""
