#!/bin/bash
# ===========================================
# CRM-Bank Local Docker Testing Script
# สำหรับ Linux/Mac
# ===========================================

set -e

# ย้ายไปที่ root directory ของโปรเจค
cd "$(dirname "$0")/.."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "\n${BLUE}==========================================="
    echo -e "  CRM-Bank Local Docker Testing"
    echo -e "===========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
}

show_menu() {
    echo "Please select an option:"
    echo ""
    echo "  1. Start all services (Build and Run)"
    echo "  2. Start services only (without rebuild)"
    echo "  3. Run database migration"
    echo "  4. Run database seed"
    echo "  5. View logs"
    echo "  6. Stop all services"
    echo "  7. Stop and remove all data (Clean restart)"
    echo "  8. Check service status"
    echo "  9. Connect to database (psql)"
    echo "  0. Exit"
    echo ""
}

start_build() {
    print_info "Building and starting all services..."
    docker compose -f docker-compose.local.yml --env-file .env.local.docker up --build -d
    
    print_success "Services started successfully!"
    echo ""
    echo "Application URL: http://localhost:3000"
    echo "Database port: localhost:5433"
    echo ""
    print_info "Waiting for services to be ready..."
    sleep 10
    docker compose -f docker-compose.local.yml ps
}

start_only() {
    print_info "Starting all services (without rebuild)..."
    docker compose -f docker-compose.local.yml --env-file .env.local.docker up -d
    print_success "Services started!"
    echo "Application URL: http://localhost:3000"
}

run_migrate() {
    print_info "Running database migration..."
    docker compose -f docker-compose.local.yml --env-file .env.local.docker --profile migrate up migrate
    print_success "Migration completed!"
}

run_seed() {
    print_info "Running database seed..."
    docker compose -f docker-compose.local.yml --env-file .env.local.docker --profile seed up seed
    print_success "Seed completed!"
}

view_logs() {
    print_info "Showing logs (Press Ctrl+C to exit)..."
    docker compose -f docker-compose.local.yml logs -f
}

stop_services() {
    print_info "Stopping all services..."
    docker compose -f docker-compose.local.yml down
    print_success "All services stopped."
}

clean_all() {
    echo -e "${RED}[WARNING]${NC} This will remove all containers and data!"
    read -p "Are you sure? (y/N): " confirm
    if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
        return
    fi
    
    print_info "Removing all containers and data..."
    docker compose -f docker-compose.local.yml down -v --remove-orphans
    docker image prune -f
    print_success "All data removed."
}

check_status() {
    print_info "Service Status:"
    echo ""
    docker compose -f docker-compose.local.yml ps
    echo ""
    print_info "Container Health:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" --filter "name=crm-"
}

connect_psql() {
    print_info "Connecting to PostgreSQL database..."
    echo "Username: crm_admin | Database: crm_bank"
    echo ""
    docker compose -f docker-compose.local.yml exec postgres psql -U crm_admin -d crm_bank
}

# Main
check_docker
print_header

while true; do
    show_menu
    read -p "Enter your choice (0-9): " choice
    
    case $choice in
        1) start_build ;;
        2) start_only ;;
        3) run_migrate ;;
        4) run_seed ;;
        5) view_logs ;;
        6) stop_services ;;
        7) clean_all ;;
        8) check_status ;;
        9) connect_psql ;;
        0) echo -e "\nGoodbye!"; exit 0 ;;
        *) print_error "Invalid choice. Please try again." ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
    echo ""
done
