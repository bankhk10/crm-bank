#!/usr/bin/env bash

# ==============================================================================
# CS ONE CRM Backup Script
# ==============================================================================
#
# Purpose
#   Backup production data for disaster recovery.
#
# What will be backed up?
#   - PostgreSQL Database (Custom Format)
#   - Uploaded Files
#   - env.production
#   - Docker Compose Files
#
# Backup Location
#   /opt/backups/YYYY-MM-DD
#
# Retention
#   Delete backups older than 30 days.
#
# Usage
#   ./scripts/backup.sh
#
# ==============================================================================

set -Eeuo pipefail

################################################################################
# Configuration
################################################################################

BACKUP_ROOT="/opt/backups"
PROJECT_ROOT="/opt/crm-bank"

DATE=$(date +%F)
BACKUP_DIR="${BACKUP_ROOT}/${DATE}"

DB_CONTAINER="crm-postgres"
DB_NAME="crm"
DB_USER="crm_admin"

UPLOADS_DIR="/home/bank/crm-data/uploads"

ENV_FILE="${PROJECT_ROOT}/deploy/env.production"

APP_COMPOSE="${PROJECT_ROOT}/deploy/app/docker-compose.app.yml"
DB_COMPOSE="${PROJECT_ROOT}/deploy/db/docker-compose.db.yml"

################################################################################
# Colors
################################################################################

GREEN="\033[0;32m"
RED="\033[0;31m"
BLUE="\033[0;34m"
YELLOW="\033[1;33m"
NC="\033[0m"

################################################################################
# Helper Functions
################################################################################

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[ OK ]${NC} $1"
}

error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

################################################################################
# Validate
################################################################################

info "Checking PostgreSQL container..."

if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
    error "Container '${DB_CONTAINER}' is not running."
    exit 1
fi

success "Container found."

################################################################################
# Create Backup Directory
################################################################################

info "Creating backup directory..."

mkdir -p "${BACKUP_DIR}"

success "Backup directory created."

################################################################################
# Backup Database
################################################################################

info "Backing up PostgreSQL database..."

docker exec "${DB_CONTAINER}" \
pg_dump \
-Fc \
-U "${DB_USER}" \
"${DB_NAME}" \
> "${BACKUP_DIR}/database.dump"

success "Database backup completed."

################################################################################
# Backup Uploads
################################################################################

info "Backing up uploaded files..."

tar -czf \
"${BACKUP_DIR}/uploads.tar.gz" \
-C /home/bank/crm-data \
uploads

success "Uploads backup completed."

################################################################################
# Copy Environment
################################################################################

info "Copying environment..."

cp "${ENV_FILE}" "${BACKUP_DIR}/"

success "Environment copied."

################################################################################
# Copy Docker Compose
################################################################################

info "Copying docker compose..."

cp "${APP_COMPOSE}" "${BACKUP_DIR}/"
cp "${DB_COMPOSE}" "${BACKUP_DIR}/"

success "Docker compose copied."

################################################################################
# Create Archive
################################################################################

info "Creating archive..."

tar -czf \
"${BACKUP_ROOT}/crm-backup-${DATE}.tar.gz" \
-C "${BACKUP_ROOT}" \
"${DATE}"

success "Archive created."

################################################################################
# Cleanup Old Backups
################################################################################

info "Removing backups older than 30 days..."

find "${BACKUP_ROOT}" \
-maxdepth 1 \
-type d \
-name "20*" \
-mtime +30 \
-exec rm -rf {} +

find "${BACKUP_ROOT}" \
-maxdepth 1 \
-name "crm-backup-*.tar.gz" \
-mtime +30 \
-delete

success "Old backups removed."

################################################################################
# Summary
################################################################################

echo
echo "=============================================="
echo " Backup completed successfully"
echo "=============================================="
echo
echo "Location : ${BACKUP_DIR}"
echo "Archive  : ${BACKUP_ROOT}/crm-backup-${DATE}.tar.gz"
echo