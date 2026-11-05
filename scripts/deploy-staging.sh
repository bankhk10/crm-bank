#!/usr/bin/env bash
# ==============================================================================
# CRM-Bank Staging Deployment Script (Cloudflare Tunnel Edition)
# 
# Purpose:
# 1. Pre-flight environment & strict branch safety checks (ONLY branch 'Test')
# 2. Build and deploy Staging Next.js App (service: app-staging only)
# 3. Verify Cloudflare Tunnel (crm-tunnel) connectivity & health check
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

# 1.3 Verify Cloudflare Tunnel Container Status
if docker ps --filter "name=^crm-tunnel$" --filter "status=running" --format '{{.Names}}' | grep -q "^crm-tunnel$"; then
    success "Cloudflare Tunnel container 'crm-tunnel' is active and running."
else
    warn "Cloudflare Tunnel container 'crm-tunnel' was not detected as running. Please verify 'docker ps | grep crm-tunnel'."
fi

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

step "3. Post-Deployment Verification & Health Check"

info "Testing Staging API Health Endpoint (https://test-csone.icgone.com/api/health)..."
HTTP_HEALTH="$(curl -s -o /dev/null -w "%{http_code}" https://test-csone.icgone.com/api/health 2>/dev/null || echo "000")"

info "Testing Staging Web Root (https://test-csone.icgone.com/)..."
HTTP_ROOT="$(curl -s -o /dev/null -w "%{http_code}" https://test-csone.icgone.com/ 2>/dev/null || echo "000")"

if [[ "${HTTP_HEALTH}" == "200" ]]; then
    success "Staging Health Check: PASS (HTTP 200 OK)"
elif [[ "${HTTP_ROOT}" == "200" || "${HTTP_ROOT}" == "307" || "${HTTP_ROOT}" == "308" || "${HTTP_ROOT}" == "302" ]]; then
    success "Staging Web Response: PASS (HTTP ${HTTP_ROOT} - Next.js Routing Active)"
else
    warn "Staging responded with HTTP Health=${HTTP_HEALTH}, HTTP Root=${HTTP_ROOT} (Container may still be warming up)."
    warn "Please check container logs: 'docker logs crm-app-staging --tail 50'."
fi

step "🎉 Staging Deployment Completed (Cloudflare Tunnel)"

echo -e "${GREEN}Summary:${NC}"
echo -e "  - Deployed Service: ${BOLD}app-staging (crm-app-staging)${NC}"
echo -e "  - Branch: ${BOLD}${CURRENT_BRANCH}${NC}"
echo -e "  - Staging Domain: ${BOLD}https://test-csone.icgone.com${NC}"
echo -e "  - Edge Routing: ${BOLD}Cloudflare Tunnel (crm-tunnel -> http://crm-app-staging:3000)${NC}"
echo -e "  - Production Safety: ${BOLD}100% Protected (No changes to Production App/DB)${NC}"
echo ""
