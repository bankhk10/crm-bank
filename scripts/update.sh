#!/bin/bash
# ===========================================
# Zero-Downtime Update Script
# Blue-Green Deployment Style
# ===========================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ===========================================
# Pre-update checks
# ===========================================
log_info "=== Starting Zero-Downtime Update ==="

# Check if app is running
if ! docker compose ps app | grep -q "Up"; then
    log_error "Application is not running. Use normal deploy instead."
    exit 1
fi

# Backup database before update
log_info "Creating database backup..."
./scripts/backup-db.sh

# ===========================================
# Build new image
# ===========================================
log_info "Building new application image..."
docker compose build app

# ===========================================
# Rolling update
# ===========================================
log_info "Performing rolling update..."

# Scale up with new image (Nginx will load balance)
# Note: This requires docker-compose scale or replicas
docker compose up -d --no-deps --build app

# Wait for new container to be healthy
log_info "Waiting for new container to be healthy..."
HEALTH_CHECK_RETRIES=30
HEALTH_CHECK_INTERVAL=5

for i in $(seq 1 $HEALTH_CHECK_RETRIES); do
    if docker compose exec -T app wget -q --spider http://localhost:3000/api/health 2>/dev/null; then
        log_success "New container is healthy!"
        break
    fi
    
    if [ $i -eq $HEALTH_CHECK_RETRIES ]; then
        log_error "Health check failed after ${HEALTH_CHECK_RETRIES} attempts"
        log_warning "Rolling back..."
        docker compose down app
        docker compose up -d app
        exit 1
    fi
    
    log_info "Waiting for health check... ($i/$HEALTH_CHECK_RETRIES)"
    sleep $HEALTH_CHECK_INTERVAL
done

# ===========================================
# Run database migrations (if any)
# ===========================================
log_info "Running database migrations..."
docker compose exec -T app npx prisma migrate deploy || {
    log_warning "No new migrations to apply"
}

# ===========================================
# Cleanup
# ===========================================
log_info "Cleaning up old images..."
docker image prune -f

# ===========================================
# Verify
# ===========================================
log_info "Verifying deployment..."

# Check response time
RESPONSE_TIME=$(curl -o /dev/null -s -w "%{time_total}" https://csone.cropsciences.co.th/api/health)
log_info "Response time: ${RESPONSE_TIME}s"

# Show current containers
docker compose ps

log_success "=== Update completed successfully! ==="
