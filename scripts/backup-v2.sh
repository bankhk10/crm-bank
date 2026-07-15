#!/usr/bin/env bash

# ==============================================================================
# CS ONE CRM Backup Script v2.0
# ==============================================================================
#
# Purpose
#   Full Bare Metal Recovery Backup
#
# Backup Includes
#   ✔ PostgreSQL (.dump)
#   ✔ PostgreSQL (.sql)
#   ✔ Upload Files
#   ✔ Source Code
#   ✔ Nginx Configuration
#   ✔ Environment
#   ✔ Docker Compose
#   ✔ Backup Information
#   ✔ SHA256 Checksum
#
# Output
#   /opt/backups/YYYY-MM-DD
#
# Archive
#   /opt/backups/crm-backup-YYYY-MM-DD.tar.gz
#
# ==============================================================================

set -Eeuo pipefail

################################################################################
# Configuration
################################################################################

PROJECT_ROOT="/opt/crm-bank"
BACKUP_ROOT="/opt/backups"

DATE=$(date +%F)
BACKUP_DIR="${BACKUP_ROOT}/${DATE}"

RETENTION_DAYS=30

DB_CONTAINER="crm-postgres"
DB_NAME="crm"
DB_USER="crm_admin"

UPLOADS_DIR="/home/bank/crm-data/uploads"

ENV_FILE="${PROJECT_ROOT}/deploy/env.production"

APP_COMPOSE="${PROJECT_ROOT}/deploy/app/docker-compose.app.yml"
DB_COMPOSE="${PROJECT_ROOT}/deploy/db/docker-compose.db.yml"

SOURCE_ARCHIVE="${BACKUP_DIR}/source.tar.gz"
NGINX_ARCHIVE="${BACKUP_DIR}/nginx.tar.gz"

################################################################################
# Colors
################################################################################

GREEN="\033[0;32m"
RED="\033[0;31m"
BLUE="\033[0;34m"
YELLOW="\033[1;33m"
NC="\033[0m"

################################################################################
# Helper
################################################################################

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[ OK ]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

################################################################################
# Validate Environment
################################################################################

info "Validating environment..."

[[ -d "$PROJECT_ROOT" ]] || {
    error "Project directory not found."
    exit 1
}

[[ -f "$ENV_FILE" ]] || {
    error "env.production not found."
    exit 1
}

docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$" || {
    error "PostgreSQL container '${DB_CONTAINER}' is not running."
    exit 1
}

mkdir -p "$BACKUP_DIR"

success "Environment validated."

################################################################################
# Backup PostgreSQL (Custom Format)
################################################################################

info "Backing up PostgreSQL (.dump)..."

docker exec "$DB_CONTAINER" \
    pg_dump \
    -Fc \
    -U "$DB_USER" \
    "$DB_NAME" \
    > "${BACKUP_DIR}/database.dump"

[[ -f "${BACKUP_DIR}/database.dump" ]] || {
    error "database.dump not created."
    exit 1
}

success "database.dump completed."

################################################################################
# Backup PostgreSQL (SQL)
################################################################################

info "Backing up PostgreSQL (.sql)..."

docker exec "$DB_CONTAINER" \
    pg_dump \
    -U "$DB_USER" \
    "$DB_NAME" \
    > "${BACKUP_DIR}/database.sql"

[[ -f "${BACKUP_DIR}/database.sql" ]] || {
    error "database.sql not created."
    exit 1
}

success "database.sql completed."

################################################################################
# Backup Uploads
################################################################################

info "Backing up uploads..."

tar -czf \
    "${BACKUP_DIR}/uploads.tar.gz" \
    -C "$(dirname "$UPLOADS_DIR")" \
    "$(basename "$UPLOADS_DIR")"

[[ -f "${BACKUP_DIR}/uploads.tar.gz" ]] || {
    error "uploads backup failed."
    exit 1
}

success "Uploads completed."

################################################################################
# Backup Source Code
################################################################################

info "Backing up source code..."

tar \
    --exclude=".git" \
    --exclude="node_modules" \
    --exclude=".next" \
    --exclude="coverage" \
    --exclude="logs" \
    --exclude="backups" \
    --exclude=".turbo" \
    --exclude=".idea" \
    --exclude=".vscode" \
    --exclude="nginx" \
    -czf "$SOURCE_ARCHIVE" \
    -C /opt \
    crm-bank

[[ -f "$SOURCE_ARCHIVE" ]] || {
    error "Source backup failed."
    exit 1
}

success "Source code completed."

################################################################################
# Backup Nginx
################################################################################

info "Backing up nginx..."

tar -czf \
    --exclude="*.log" \
    "$NGINX_ARCHIVE" \
    -C "$PROJECT_ROOT" \
    nginx

[[ -f "$NGINX_ARCHIVE" ]] || {
    error "Nginx backup failed."
    exit 1
}

success "Nginx completed."

################################################################################
# Copy Environment & Docker Compose
################################################################################

info "Copying configuration..."

cp "$ENV_FILE" "$BACKUP_DIR/"
cp "$APP_COMPOSE" "$BACKUP_DIR/"
cp "$DB_COMPOSE" "$BACKUP_DIR/"

success "Configuration copied."

################################################################################
# Generate Backup Information
################################################################################

info "Generating backup information..."

cat > "${BACKUP_DIR}/backup-info.txt" <<EOF
Backup Version : 2.0

Project        : CS ONE CRM

Backup Date    : $(date)

Hostname       : $(hostname)

OS             : $(lsb_release -ds 2>/dev/null || uname -a)

Docker         : $(docker --version)

Compose        : $(docker compose version | head -1)

PostgreSQL     : $(docker exec "$DB_CONTAINER" psql --version)

Disk Usage     : $(df -h / | tail -1)

EOF

success "backup-info.txt created."

################################################################################
# Generate SHA256
################################################################################

info "Generating SHA256 checksums..."

(
    cd "$BACKUP_DIR"

    sha256sum \
        database.dump \
        database.sql \
        uploads.tar.gz \
        source.tar.gz \
        nginx.tar.gz \
        env.production \
        docker-compose.app.yml \
        docker-compose.db.yml \
        backup-info.txt \
        > SHA256SUMS
)

[[ -f "${BACKUP_DIR}/SHA256SUMS" ]] || {
    error "SHA256SUMS not created."
    exit 1
}

success "SHA256 generated."

################################################################################
# Verify Backup
################################################################################

info "Verifying backup files..."

REQUIRED_FILES=(
    "database.dump"
    "database.sql"
    "uploads.tar.gz"
    "source.tar.gz"
    "nginx.tar.gz"
    "env.production"
    "docker-compose.app.yml"
    "docker-compose.db.yml"
    "backup-info.txt"
    "SHA256SUMS"
)

for FILE in "${REQUIRED_FILES[@]}"; do
    if [[ ! -f "${BACKUP_DIR}/${FILE}" ]]; then
        error "Missing ${FILE}"
        exit 1
    fi
done

success "Backup verification completed."

################################################################################
# Create Archive
################################################################################

info "Creating compressed archive..."

ARCHIVE="${BACKUP_ROOT}/crm-backup-${DATE}.tar.gz"

tar -czf \
    "$ARCHIVE" \
    -C "$BACKUP_ROOT" \
    "$DATE"

[[ -f "$ARCHIVE" ]] || {
    error "Archive creation failed."
    exit 1
}

success "Archive created."

################################################################################
# Cleanup Old Backups
################################################################################

info "Removing backups older than ${RETENTION_DAYS} days..."

find "$BACKUP_ROOT" \
    -maxdepth 1 \
    -type d \
    -name "20*" \
    -mtime +${RETENTION_DAYS} \
    -exec rm -rf {} +

find "$BACKUP_ROOT" \
    -maxdepth 1 \
    -type f \
    -name "crm-backup-*.tar.gz" \
    -mtime +${RETENTION_DAYS} \
    -delete

success "Old backups removed."

################################################################################
# Statistics
################################################################################

BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | awk '{print $1}')
ARCHIVE_SIZE=$(du -sh "$ARCHIVE" | awk '{print $1}')
FILE_COUNT=$(find "$BACKUP_DIR" -type f | wc -l)

################################################################################
# Summary
################################################################################

echo
echo "============================================================"
echo "            CS ONE CRM Backup Completed"
echo "============================================================"
echo
echo " Backup Date     : $(date)"
echo " Backup Folder   : ${BACKUP_DIR}"
echo " Archive         : ${ARCHIVE}"
echo
echo " Folder Size     : ${BACKUP_SIZE}"
echo " Archive Size    : ${ARCHIVE_SIZE}"
echo " Files           : ${FILE_COUNT}"
echo
echo " Included:"
echo "   ✔ PostgreSQL (.dump)"
echo "   ✔ PostgreSQL (.sql)"
echo "   ✔ Upload Files"
echo "   ✔ Source Code"
echo "   ✔ Nginx Configuration"
echo "   ✔ Environment"
echo "   ✔ Docker Compose"
echo "   ✔ Backup Information"
echo "   ✔ SHA256 Checksums"
echo
echo " Retention       : ${RETENTION_DAYS} Days"
echo
echo "============================================================"
echo

################################################################################
# Exit
################################################################################

exit 0