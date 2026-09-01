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
info() { echo -e "${CYAN}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1" >&2; }
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

# Robust parser to extract exact server blocks with nested brace tracking and exact domain token matching
extract_server_block() {
    local domain="$1"
    local type="${2:-https}" # https, http, all
    
    echo "${NGINX_FULL_CONFIG}" | awk -v target_domain="${domain}" -v target_type="${type}" '
    BEGIN {
        in_server = 0
        depth = 0
        server_buf = ""
    }
    {
        line = $0
        clean_line = line
        sub(/#.*/, "", clean_line)
    }
    # Match start of server block, ignoring upstream server directives
    !in_server && clean_line ~ /^[[:space:]]*server([[:space:]]*\{|[[:space:]]*$)/ && clean_line !~ /;/ {
        in_server = 1
        depth = 0
        server_buf = ""
    }
    in_server {
        server_buf = server_buf line "\n"
        
        temp_open = clean_line; n_open = gsub(/\{/, "", temp_open)
        temp_close = clean_line; n_close = gsub(/\}/, "", temp_close)
        depth += (n_open - n_close)
        
        if (depth <= 0 && server_buf ~ /\{/) {
            in_server = 0
            depth = 0
            
            # Match exact domain token in server_name (must not match substrings like test-csone matching csone)
            domain_pattern = "server_name[[:space:]]+([^;]*[[:space:]]+)?" target_domain "([[:space:]]+|;)"
            
            if (server_buf ~ domain_pattern) {
                is_https = (server_buf ~ /listen[[:space:]]+.*443/ || server_buf ~ /listen[[:space:]]+.*ssl/ || server_buf ~ /ssl_certificate/)
                is_http = (server_buf ~ /listen[[:space:]]+.*80/ && !is_https)
                
                if (target_type == "https" && is_https) {
                    print server_buf
                } else if (target_type == "http" && is_http) {
                    print server_buf
                } else if (target_type == "all") {
                    print server_buf
                }
            }
            server_buf = ""
        }
    }
    '
}

# Robust parser to extract exact location blocks within a server block using nested brace tracking
extract_location_block() {
    local block="$1"
    local loc_path="$2"
    
    echo "${block}" | awk -v target_loc="${loc_path}" '
    BEGIN { in_loc=0; depth=0; buf="" }
    {
        line = $0; clean = line; sub(/#.*/, "", clean)
    }
    !in_loc && clean ~ ("location[[:space:]]+" target_loc) {
        in_loc=1; depth=0; buf=""
    }
    in_loc {
        buf = buf line "\n"
        t_o = clean; n_o = gsub(/\{/, "", t_o)
        t_c = clean; n_c = gsub(/\}/, "", t_c)
        depth += (n_o - n_c)
        if (depth <= 0 && buf ~ /\{/) {
            print buf
            in_loc=0
            exit
        }
    }
    '
}

PROD_HTTPS_BLOCK="$(extract_server_block "csone.cropsciences.co.th" "https")"
STAGING_HTTPS_BLOCK="$(extract_server_block "test-csone.cropsciences.co.th" "https")"

# 6.1 Check Production Domain Routing
if [[ -z "${PROD_HTTPS_BLOCK}" ]]; then
    rollback_staging_config "Production HTTPS server block for 'csone.cropsciences.co.th' was not found in active Nginx config!"
    exit 1
fi

PROD_UPSTREAM="$(echo "${PROD_HTTPS_BLOCK}" | grep -E "proxy_pass" | head -1 | awk '{print $2}' | tr -d ';' || echo "unknown")"
info "Detected Production Upstream: ${PROD_UPSTREAM}"

if echo "${PROD_HTTPS_BLOCK}" | grep -qE "crm-app-staging|staging_upstream"; then
    rollback_staging_config "CRITICAL SAFETY VIOLATION: Production server block contains staging routing targets!"
    exit 1
fi

if [[ -z "${PROD_UPSTREAM}" || "${PROD_UPSTREAM}" == "unknown" ]]; then
    rollback_staging_config "Production server block is missing a valid proxy_pass upstream target!"
    exit 1
fi
success "Safety Check 1/4: Production HTTPS routing verified (Upstream: ${PROD_UPSTREAM}, No staging targets)."

# 6.2 Check Staging Domain Routing
if [[ -z "${STAGING_HTTPS_BLOCK}" ]]; then
    rollback_staging_config "Staging HTTPS server block for 'test-csone.cropsciences.co.th' was not found in active Nginx config!"
    exit 1
fi

STAGING_UPSTREAM="$(echo "${STAGING_HTTPS_BLOCK}" | grep -E "set \$staging_upstream" | head -1 | awk '{print $NF}' | tr -d ';' || echo "unknown")"
info "Detected Staging Upstream: ${STAGING_UPSTREAM}"

if ! echo "${STAGING_HTTPS_BLOCK}" | grep -qE "staging_upstream|crm-app-staging:3000"; then
    rollback_staging_config "Staging server block does not route to \$staging_upstream or crm-app-staging:3000!"
    exit 1
fi
success "Safety Check 2/4: Staging HTTPS routing verified (Upstream: ${STAGING_UPSTREAM})."

# 6.3 Check Staging Uploads Location (Isolated Proxy Pass)
STAGING_UPLOADS_BLOCK="$(extract_location_block "${STAGING_HTTPS_BLOCK}" "/uploads/")"

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

# 6.4 Strict Cross-Routing & Production Upload Protection
PROD_UPLOADS_BLOCK="$(extract_location_block "${PROD_HTTPS_BLOCK}" "/uploads/")"
if [[ -n "${PROD_UPLOADS_BLOCK}" ]] && echo "${PROD_UPLOADS_BLOCK}" | grep -qE "staging_upstream|crm-app-staging"; then
    rollback_staging_config "CRITICAL SAFETY VIOLATION: Production upload location contains staging references!"
    exit 1
fi

if echo "${STAGING_HTTPS_BLOCK}" | grep -qE "csone\.cropsciences\.co\.th|nextjs_app"; then
    rollback_staging_config "CRITICAL SAFETY VIOLATION: Staging server block contains references to Production domain or upstream!"
    exit 1
fi
success "Safety Check 4/4: Strict cross-routing isolation verified between Production and Staging."

step "7. Safe Nginx Reload (Zero Downtime)"

info "Reloading Shared Nginx via SIGHUP..."
docker exec crm-nginx nginx -s reload
success "Shared Nginx reloaded successfully (0 Downtime)."

step "8. Post-Deployment Verification & Health Check"

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
