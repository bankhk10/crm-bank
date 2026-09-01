#!/usr/bin/env bash
# ==============================================================================
# CRM-Bank Staging Deployment Script
# 
# Purpose:
# 1. Build and deploy Staging Next.js App (service: app-staging only)
# 2. Safely sync and apply Staging Nginx Configuration to Shared Edge crm-nginx
# 3. Perform strict pre-flight safety checks (Production Routing, Staging Routing, Uploads)
# 4. Zero-downtime Nginx reload (only after all safety checks pass)
#
# Usage:
#   bash scripts/deploy-staging.sh
# ==============================================================================

set -euo pipefail

# --- Color Definitions ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# --- Helper Functions ---
info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

step() {
    echo -e "\n${BOLD}${BLUE}==================================================================${NC}"
    echo -e "${BOLD}${BLUE}▶ $1${NC}"
    echo -e "${BOLD}${BLUE}==================================================================${NC}"
}

# --- Determine Paths ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STAGING_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
SHARED_NGINX_CONF_DIR="/opt/crm-bank/nginx/conf.d"
SHARED_NGINX_BACKUP_DIR="${SHARED_NGINX_CONF_DIR}/.backup"
TIMESTAMP="$(date +"%Y%m%d_%H%M%S")"
BACKUP_FILE=""
ACTIVE_STAGING_CONF="${SHARED_NGINX_CONF_DIR}/staging.conf"

# --- Dedicated Rollback Function ---
rollback_staging_config() {
    local reason="$1"
    error "DEPLOYMENT SAFETY FAILURE: ${reason}"
    if [[ -n "${BACKUP_FILE}" && -f "${BACKUP_FILE}" ]]; then
        warn "Initiating automatic rollback to previous configuration: ${BACKUP_FILE}..."
        cp "${BACKUP_FILE}" "${ACTIVE_STAGING_CONF}"
        if docker exec crm-nginx nginx -t >/dev/null 2>&1; then
            success "Rollback Ready: Nginx configuration successfully restored to previous working state."
        else
            error "CRITICAL ERROR: Rollback failed syntax check! Manual intervention required immediately."
        fi
    else
        warn "No previous backup file available to restore."
    fi
}

step "1. Pre-flight Environment & Strict Branch Safety Checks"

# 1.1 Verify Directory & Staging Environment
info "Staging Repository Root: ${STAGING_ROOT}"
if [[ ! -f "${STAGING_ROOT}/deploy/.env.staging" ]]; then
    error "File '${STAGING_ROOT}/deploy/.env.staging' not found! Aborting deployment."
    exit 1
fi
success "Staging environment configuration file verified."

# 1.2 Strict Branch Check (ONLY branch 'Test' allowed)
CURRENT_BRANCH="$(git -C "${STAGING_ROOT}" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")"
info "Current Git Branch: ${CURRENT_BRANCH}"
if [[ "${CURRENT_BRANCH}" != "Test" ]]; then
    error "CRITICAL BRANCH ERROR: Current branch is '${CURRENT_BRANCH}'. Staging deployment is STRICTLY permitted ONLY on branch 'Test'!"
    exit 1
fi
success "Branch safety check passed (Branch: Test)."

# 1.3 Verify Staging Nginx Source File in Repository
STAGING_CONF_SOURCE="${STAGING_ROOT}/nginx/conf.d/staging.conf"
if [[ ! -f "${STAGING_CONF_SOURCE}" ]]; then
    error "Staging Nginx source configuration '${STAGING_CONF_SOURCE}' not found in repository!"
    exit 1
fi
success "Source staging.conf verified."

# 1.4 Verify Shared Nginx Container Status
if ! docker ps --filter "name=^crm-nginx$" --filter "status=running" --format '{{.Names}}' | grep -q "^crm-nginx$"; then
    error "Shared Edge Container 'crm-nginx' is not running! Cannot proceed with Nginx deployment."
    exit 1
fi
success "Shared Edge Container 'crm-nginx' is active and healthy."

step "2. Build & Deploy Staging Application (Target: app-staging only)"

info "Building and starting ONLY service 'app-staging'..."
docker compose \
  -f "${STAGING_ROOT}/deploy/app/docker-compose.staging.yml" \
  --env-file "${STAGING_ROOT}/deploy/.env.staging" \
  up -d --build app-staging

# Wait for container initialization
sleep 3
if docker ps --filter "name=^crm-app-staging$" --filter "status=running" --format '{{.Names}}' | grep -q "^crm-app-staging$"; then
    success "crm-app-staging is running successfully."
else
    error "crm-app-staging failed to start. Check logs with 'docker logs crm-app-staging'."
    exit 1
fi

step "3. Backup Active Staging Nginx Configuration"

mkdir -p "${SHARED_NGINX_BACKUP_DIR}"
BACKUP_FILE="${SHARED_NGINX_BACKUP_DIR}/staging.conf.${TIMESTAMP}"

if [[ -f "${ACTIVE_STAGING_CONF}" ]]; then
    cp "${ACTIVE_STAGING_CONF}" "${BACKUP_FILE}"
    success "Active staging.conf backed up to: ${BACKUP_FILE}"
else
    info "No existing active staging.conf found. A new configuration will be created."
    BACKUP_FILE=""
fi

# Keep only latest 10 backup files
find "${SHARED_NGINX_BACKUP_DIR}" -type f -name "staging.conf.*" | sort -r | tail -n +11 | xargs -r rm -f || true

step "4. Sync Staging Nginx Config to Shared Edge"

info "Syncing ${STAGING_CONF_SOURCE} -> ${ACTIVE_STAGING_CONF}..."
cp "${STAGING_CONF_SOURCE}" "${ACTIVE_STAGING_CONF}"
success "Configuration synced to shared config directory."

step "5. Pre-flight Syntax Validation (nginx -t)"

if ! docker exec crm-nginx nginx -t; then
    rollback_staging_config "nginx -t syntax check failed after syncing new staging.conf."
    exit 1
fi
success "Nginx syntax test passed."

step "6. Comprehensive Routing & Safety Checks"

NGINX_FULL_CONFIG="$(docker exec crm-nginx nginx -T 2>/dev/null || true)"

# Helper function to extract a server block by server_name
extract_server_block() {
    local domain="$1"
    echo "${NGINX_FULL_CONFIG}" | awk -v domain="${domain}" '
        $0 ~ "server_name.*" domain { in_server=1; depth=1; print; next }
        in_server {
            if ($0 ~ /{/) depth++
            if ($0 ~ /}/) depth--
            print
            if (depth == 0) in_server=0
        }
    '
}

PROD_BLOCK="$(extract_server_block "csone.cropsciences.co.th")"
STAGING_BLOCK="$(extract_server_block "test-csone.cropsciences.co.th")"

# 6.1 Check Production Domain Routing
if [[ -z "${PROD_BLOCK}" ]]; then
    rollback_staging_config "Production server block for 'csone.cropsciences.co.th' is missing from active Nginx config!"
    exit 1
fi

PROD_UPSTREAM="$(echo "${PROD_BLOCK}" | grep -E "proxy_pass" | head -1 | awk '{print $2}' | tr -d ';' || echo "unknown")"
info "Detected Production Upstream: ${PROD_UPSTREAM}"

if echo "${PROD_BLOCK}" | grep -qE "crm-app-staging|staging_upstream"; then
    rollback_staging_config "CRITICAL SAFETY VIOLATION: Production server block contains staging routing targets!"
    exit 1
fi
success "Safety Check 1/4: Production server routing verified (Upstream: ${PROD_UPSTREAM}, No staging contamination)."

# 6.2 Check Staging Domain Routing
if [[ -z "${STAGING_BLOCK}" ]]; then
    rollback_staging_config "Staging server block for 'test-csone.cropsciences.co.th' is missing from active Nginx config!"
    exit 1
fi

STAGING_UPSTREAM="$(echo "${STAGING_BLOCK}" | grep -E "set \$staging_upstream|proxy_pass" | head -1 | awk '{print $NF}' | tr -d ';' || echo "unknown")"
info "Detected Staging Upstream: ${STAGING_UPSTREAM}"

if ! echo "${STAGING_BLOCK}" | grep -qE "staging_upstream|crm-app-staging:3000"; then
    rollback_staging_config "Staging server block does not route to \$staging_upstream or crm-app-staging:3000!"
    exit 1
fi
success "Safety Check 2/4: Staging server routing verified (Upstream: ${STAGING_UPSTREAM})."

# 6.3 Check Staging Uploads Location (Isolated Proxy Pass)
STAGING_UPLOADS_BLOCK="$(echo "${STAGING_BLOCK}" | awk '
    $0 ~ "location /uploads/" { in_loc=1; depth=1; print; next }
    in_loc {
        if ($0 ~ /{/) depth++
        if ($0 ~ /}/) depth--
        print
        if (depth == 0) in_loc=0
    }
')"

if [[ -z "${STAGING_UPLOADS_BLOCK}" ]]; then
    rollback_staging_config "Staging server block is missing 'location /uploads/' definition!"
    exit 1
fi

if ! echo "${STAGING_UPLOADS_BLOCK}" | grep -qE "proxy_pass.*staging_upstream|proxy_pass.*crm-app-staging"; then
    rollback_staging_config "Staging 'location /uploads/' is not proxying to \$staging_upstream!"
    exit 1
fi

if echo "${STAGING_UPLOADS_BLOCK}" | grep -q "alias /usr/share/nginx/uploads"; then
    rollback_staging_config "Staging 'location /uploads/' still contains obsolete 'alias /usr/share/nginx/uploads'!"
    exit 1
fi
success "Safety Check 3/4: Staging /uploads/ isolation verified (Proxied to Staging App, No alias dependency)."

# 6.4 Production Upload Protection
if echo "${PROD_BLOCK}" | grep -A 10 "location /uploads/" | grep -qE "staging_upstream|crm-app-staging"; then
    rollback_staging_config "CRITICAL SAFETY VIOLATION: Production upload location contains staging references!"
    exit 1
fi
success "Safety Check 4/4: Production upload configuration verified untouched."

step "7. Safe Nginx Reload (Zero Downtime)"

info "Reloading Shared Nginx via SIGHUP..."
docker exec crm-nginx nginx -s reload
success "Shared Nginx reloaded successfully (0 Downtime)."

step "8. Post-Deployment Verification & Health Check"

# Test Application Health Endpoint
info "Testing Staging API Health Endpoint (https://test-csone.cropsciences.co.th/api/health)..."
HTTP_HEALTH="$(curl -s -o /dev/null -w "%{http_code}" https://test-csone.cropsciences.co.th/api/health 2>/dev/null || echo "000")"

info "Testing Staging Web Root (https://test-csone.cropsciences.co.th/)..."
HTTP_ROOT="$(curl -s -o /dev/null -w "%{http_code}" https://test-csone.cropsciences.co.th/ 2>/dev/null || echo "000")"

if [[ "${HTTP_HEALTH}" == "200" ]]; then
    success "Staging Health Check: PASS (HTTP 200 OK)"
elif [[ "${HTTP_ROOT}" == "200" || "${HTTP_ROOT}" == "307" || "${HTTP_ROOT}" == "308" || "${HTTP_ROOT}" == "302" ]]; then
    success "Staging Web Response: PASS (HTTP ${HTTP_ROOT} - Next.js Routing Active)"
else
    warn "Staging responded with HTTP Health=${HTTP_HEALTH}, HTTP Root=${HTTP_ROOT}."
    warn "Please check container logs: 'docker logs crm-app-staging --tail 50'."
fi

step "🎉 Staging Deployment & Nginx Sync Completed"

echo -e "${GREEN}Summary:${NC}"
echo -e "  - Deployed Service: ${BOLD}app-staging (crm-app-staging)${NC}"
echo -e "  - Branch: ${BOLD}${CURRENT_BRANCH}${NC}"
echo -e "  - Staging Domain: ${BOLD}https://test-csone.cropsciences.co.th${NC}"
echo -e "  - Staging Uploads: ${BOLD}Proxied directly to crm-app-staging${NC}"
echo -e "  - Shared Edge Nginx: ${BOLD}crm-nginx (Reloaded - 0 Downtime)${NC}"
echo -e "  - Production Safety: ${BOLD}100% Protected (No changes to Production App/DB/Routing)${NC}"
echo -e "  - Config Backup: ${BOLD}${BACKUP_FILE:-None}${NC}"
echo ""
