#!/bin/bash
# ===========================================
# Database Backup Script
# ===========================================

set -e

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="crm_bank_backup_${DATE}.sql"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"

log_info "Starting database backup..."

# Run pg_dump inside the postgres container
docker compose exec -T postgres pg_dump \
    -U "${POSTGRES_USER:-crm_admin}" \
    -d "${POSTGRES_DB:-crm_bank}" \
    --no-owner \
    --no-acl \
    > "${BACKUP_DIR}/${BACKUP_FILE}"

# Compress backup
gzip "${BACKUP_DIR}/${BACKUP_FILE}"

log_success "Backup created: ${BACKUP_DIR}/${BACKUP_FILE}.gz"

# Clean old backups (keep last 30 days)
log_info "Cleaning old backups (older than 30 days)..."
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete

# List existing backups
log_info "Existing backups:"
ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "No backups found"
