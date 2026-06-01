#!/bin/bash
# Docker Deployment Script for POS System
# Professional-grade deployment with health checks and verification

set -e

echo "============================================================"
echo "  POS System - Docker Deployment"
echo "============================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_status "Docker and Docker Compose are installed"

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from .env.docker..."
    cp .env.docker .env
    print_status "Created .env file. Please review and update values if needed."
fi

# Step 1: Stop existing containers
echo ""
echo "Step 1: Stopping existing containers..."
docker-compose down --remove-orphans 2>/dev/null || true
print_status "Existing containers stopped"

# Step 2: Pull latest images (if any)
echo ""
echo "Step 2: Pulling latest base images..."
docker-compose pull 2>/dev/null || true
print_status "Base images updated"

# Step 3: Build images
echo ""
echo "Step 3: Building Docker images..."
docker-compose build --no-cache
print_status "Docker images built successfully"

# Step 4: Start containers
echo ""
echo "Step 4: Starting containers..."
docker-compose up -d
print_status "Containers started"

# Step 5: Wait for services to be healthy
echo ""
echo "Step 5: Waiting for services to be ready..."
echo "  - Waiting for PostgreSQL..."
sleep 10

echo "  - Waiting for Backend API..."
for i in {1..30}; do
    if curl -s http://localhost:5000/health > /dev/null 2>&1; then
        print_status "Backend API is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Backend API failed to start"
        docker-compose logs backend
        exit 1
    fi
    sleep 2
done

echo "  - Waiting for Frontend..."
for i in {1..15}; do
    if curl -s http://localhost:80 > /dev/null 2>&1; then
        print_status "Frontend is ready"
        break
    fi
    if [ $i -eq 15 ]; then
        print_error "Frontend failed to start"
        docker-compose logs frontend
        exit 1
    fi
    sleep 2
done

# Step 6: Verify deployment
echo ""
echo "Step 6: Verifying deployment..."
echo ""

# Check PostgreSQL
if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
    print_status "PostgreSQL: Running"
else
    print_error "PostgreSQL: Not responding"
fi

# Check Backend
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health)
if [ "$BACKEND_STATUS" = "200" ]; then
    print_status "Backend API: Running (Port 5000)"
else
    print_error "Backend API: Not responding (Status: $BACKEND_STATUS)"
fi

# Check Frontend
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80)
if [ "$FRONTEND_STATUS" = "200" ]; then
    print_status "Frontend: Running (Port 80)"
else
    print_error "Frontend: Not responding (Status: $FRONTEND_STATUS)"
fi

# Step 7: Display access information
echo ""
echo "============================================================"
echo -e "${GREEN}  ✓ DEPLOYMENT COMPLETE!${NC}"
echo "============================================================"
echo ""
echo "  Frontend:  http://localhost"
echo "  Backend:   http://localhost:5000"
echo "  API Docs:  http://localhost:5000/api/v1"
echo "  Health:    http://localhost:5000/health"
echo ""
echo "  Default Credentials:"
echo "    Super Admin: factssolution@gmail.com"
echo "    Password:    Black@786##"
echo ""
echo "============================================================"
echo "  Useful Commands:"
echo "============================================================"
echo ""
echo "  View logs:          docker-compose logs -f"
echo "  View backend logs:  docker-compose logs -f backend"
echo "  Stop services:      docker-compose down"
echo "  Restart services:   docker-compose restart"
echo "  Rebuild:            docker-compose up -d --build"
echo "  Database shell:     docker-compose exec postgres psql -U postgres"
echo ""
echo "============================================================"
