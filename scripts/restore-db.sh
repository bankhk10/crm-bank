#!/bin/bash
# ===========================================
# Database Restore Script
# ===========================================

set -e

BACKUP_DIR="./backups"

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

# Check if backup file is provided
if [ -z "$1" ]; then
    log_info "Available backups:"
    ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "No backups found"
    echo ""
    echo "Usage: $0 <backup_file.sql.gz>"
    exit 1
fi

BACKUP_FILE="$1"

# Check if file exists
if [ ! -f "$BACKUP_FILE" ]; then
    log_error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

log_warning "This will REPLACE the current database!"
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    log_info "Restore cancelled"
    exit 0
fi

log_info "Restoring database from: $BACKUP_FILE"

# Decompress and restore
gunzip -c "$BACKUP_FILE" | docker compose exec -T postgres psql \
    -U "${POSTGRES_USER:-crm_admin}" \
    -d "${POSTGRES_DB:-crm_bank}"

log_success "Database restored successfully!"

# Run migrations to ensure schema is up to date
log_info "Running migrations..."
docker compose exec -T app npx prisma migrate deploy

log_success "Restore completed!"
