#!/bin/bash
# ===========================================
# CRM-Bank Production Deployment Script
# Server: Ubuntu 24.04.3 LTS
# Domain: csone.cropsciences.co.th
# ===========================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ===========================================
# Step 1: Check prerequisites
# ===========================================
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if running as root
    if [ "$EUID" -ne 0 ]; then
        log_error "Please run as root or with sudo"
        exit 1
    fi
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_warning "Docker not installed. Installing..."
        install_docker
    else
        log_success "Docker is installed: $(docker --version)"
    fi
    
    # Check if Docker Compose is available
    if ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not available"
        exit 1
    else
        log_success "Docker Compose is available: $(docker compose version)"
    fi
}

# ===========================================
# Step 2: Install Docker
# ===========================================
install_docker() {
    log_info "Installing Docker on Ubuntu 24.04..."
    
    # Update package index
    apt-get update
    
    # Install prerequisites
    apt-get install -y \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Add Docker's official GPG key
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    
    # Set up the repository
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
        $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
        tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
    
    log_success "Docker installed successfully"
}

# ===========================================
# Step 3: Setup Firewall (UFW)
# ===========================================
setup_firewall() {
    log_info "Configuring UFW firewall..."
    
    # Install UFW if not present
    apt-get install -y ufw
    
    # Set default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH (important! don't lock yourself out)
    ufw allow 22/tcp comment 'SSH'
    
    # Allow HTTP and HTTPS
    ufw allow 80/tcp comment 'HTTP'
    ufw allow 443/tcp comment 'HTTPS'
    
    # Enable UFW (non-interactive)
    echo "y" | ufw enable
    
    log_success "Firewall configured"
    ufw status verbose
}

# ===========================================
# Step 4: Check environment file
# ===========================================
check_env_file() {
    log_info "Checking environment file..."
    
    if [ ! -f ".env.production" ]; then
        log_error ".env.production file not found!"
        log_info "Please create .env.production from .env.production.example"
        log_info "Command: cp .env.production.example .env.production"
        log_info "Then edit .env.production with your actual values"
        exit 1
    fi
    
    # Check for placeholder values
    if grep -q "CHANGE_ME" .env.production; then
        log_error "Please update all CHANGE_ME values in .env.production"
        exit 1
    fi
    
    log_success "Environment file found"
}

# ===========================================
# Step 5: Setup SSL Certificate
# ===========================================
setup_ssl() {
    log_info "Setting up SSL certificate..."
    
    DOMAIN="csone.cropsciences.co.th"
    EMAIL="${SSL_EMAIL:-admin@cropsciences.co.th}"
    
    # Create directories
    mkdir -p nginx/ssl
    mkdir -p nginx/logs
    mkdir -p nginx/conf.d
    
    # Check if certificate already exists
    if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
        log_success "SSL certificate already exists"
        return
    fi
    
    # Initial nginx config for ACME challenge (HTTP only)
    log_info "Creating temporary Nginx config for SSL verification..."
    
    cat > nginx/conf.d/temp.conf << 'EOF'
server {
    listen 80;
    server_name csone.cropsciences.co.th www.csone.cropsciences.co.th;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 200 'SSL verification in progress...';
        add_header Content-Type text/plain;
    }
}
EOF
    
    # Start nginx for ACME challenge
    docker compose up -d nginx
    sleep 5
    
    # Run certbot
    docker compose run --rm certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        -d "$DOMAIN" \
        -d "www.$DOMAIN"
    
    # Remove temp config and restore full config
    rm -f nginx/conf.d/temp.conf
    
    # Restart nginx with full SSL config
    docker compose restart nginx
    
    log_success "SSL certificate obtained successfully"
}

# ===========================================
# Step 6: Build and Deploy
# ===========================================
deploy() {
    log_info "Building and deploying application..."
    
    # Pull latest changes (if git repo)
    if [ -d ".git" ]; then
        log_info "Pulling latest changes..."
        git pull origin main || true
    fi
    
    # Build images
    log_info "Building Docker images..."
    docker compose build --no-cache
    
    # Stop existing containers
    log_info "Stopping existing containers..."
    docker compose down || true
    
    # Start containers
    log_info "Starting containers..."
    docker compose --env-file .env.production up -d
    
    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    sleep 30
    
    # Run database migrations
    log_info "Running database migrations..."
    docker compose exec -T app npx prisma migrate deploy || {
        log_warning "Migration might have failed. Check logs."
    }
    
    # Check health
    log_info "Checking application health..."
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health | grep -q "200"; then
        log_success "Application is healthy!"
    else
        log_warning "Health check failed. Checking logs..."
        docker compose logs --tail=50 app
    fi
    
    log_success "Deployment completed!"
}

# ===========================================
# Step 7: Show status
# ===========================================
show_status() {
    log_info "Current container status:"
    docker compose ps
    
    echo ""
    log_info "Resource usage:"
    docker stats --no-stream
    
    echo ""
    log_info "Application should be available at:"
    echo "  - https://csone.cropsciences.co.th"
    echo "  - http://27.254.143.48 (redirects to HTTPS)"
}

# ===========================================
# Main execution
# ===========================================
main() {
    log_info "=== CRM-Bank Production Deployment ==="
    
    case "${1:-deploy}" in
        install)
            check_prerequisites
            setup_firewall
            ;;
        ssl)
            setup_ssl
            ;;
        deploy)
            check_prerequisites
            check_env_file
            deploy
            show_status
            ;;
        status)
            show_status
            ;;
        logs)
            docker compose logs -f ${2:-}
            ;;
        restart)
            docker compose restart ${2:-}
            ;;
        stop)
            docker compose down
            ;;
        *)
            echo "Usage: $0 {install|ssl|deploy|status|logs|restart|stop}"
            echo ""
            echo "Commands:"
            echo "  install  - Install Docker and setup firewall"
            echo "  ssl      - Setup SSL certificate with Let's Encrypt"
            echo "  deploy   - Build and deploy the application"
            echo "  status   - Show current status"
            echo "  logs     - Show logs (optionally specify service)"
            echo "  restart  - Restart services"
            echo "  stop     - Stop all containers"
            exit 1
            ;;
    esac
}

main "$@"
