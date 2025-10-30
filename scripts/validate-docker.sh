#!/bin/bash

# Docker Setup Validation Script
# This script validates the Docker configuration files without building images

echo "🔍 Validating Docker setup..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASS=0
FAIL=0
WARN=0

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} Found: $1"
        ((PASS++))
        return 0
    else
        echo -e "${RED}✗${NC} Missing: $1"
        ((FAIL++))
        return 1
    fi
}

check_content() {
    if grep -Fq "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $3"
        ((PASS++))
        return 0
    else
        echo -e "${YELLOW}⚠${NC} $3"
        ((WARN++))
        return 1
    fi
}

echo "1. Checking required files..."
echo "----------------------------"
check_file "docker-compose.yml"
check_file "backend/Dockerfile"
check_file "frontend/Dockerfile"
check_file "backend/docker-entrypoint.sh"
check_file "frontend/nginx.conf"
check_file ".dockerignore"
check_file "backend/.dockerignore"
check_file "frontend/.dockerignore"
check_file ".env.example"
check_file "backend/.env.example"
check_file "frontend/.env.example"
check_file "Makefile"
check_file "DOCKER.md"
check_file "README.md"
echo ""

echo "2. Checking Docker Compose configuration..."
echo "-------------------------------------------"
check_content "docker-compose.yml" "postgres:" "PostgreSQL service defined"
check_content "docker-compose.yml" "backend:" "Backend service defined"
check_content "docker-compose.yml" "frontend:" "Frontend service defined"
check_content "docker-compose.yml" "healthcheck:" "Health checks configured"
check_content "docker-compose.yml" "restart: unless-stopped" "Restart policy configured"
check_content "docker-compose.yml" "pgdata:" "Persistent volume for database"
echo ""

echo "3. Checking Backend Dockerfile..."
echo "---------------------------------"
check_content "backend/Dockerfile" "FROM node:20-alpine AS builder" "Multi-stage build configured"
check_content "backend/Dockerfile" "npm ci" "Uses npm ci for dependencies"
check_content "backend/Dockerfile" "npx prisma generate" "Prisma client generation"
check_content "backend/Dockerfile" "npm run build" "Build step configured"
check_content "backend/Dockerfile" "HEALTHCHECK" "Health check configured"
check_content "backend/Dockerfile" "EXPOSE 3000" "Port exposed"
echo ""

echo "4. Checking Frontend Dockerfile..."
echo "----------------------------------"
check_content "frontend/Dockerfile" "FROM node:20-alpine AS build" "Multi-stage build configured"
check_content "frontend/Dockerfile" "FROM nginx:alpine" "Nginx for production serving"
check_content "frontend/Dockerfile" "npm run build" "Build step configured"
check_content "frontend/Dockerfile" "nginx.conf" "Custom nginx config"
check_content "frontend/Dockerfile" "HEALTHCHECK" "Health check configured"
check_content "frontend/Dockerfile" "EXPOSE 80" "Port exposed"
echo ""

echo "5. Checking Nginx configuration..."
echo "----------------------------------"
check_content "frontend/nginx.conf" "location /" "Root location configured"
check_content "frontend/nginx.conf" "location /api" "API proxy configured"
# Use more specific check for try_files with index.html
if grep -q "try_files" "frontend/nginx.conf" && grep -q "index.html" "frontend/nginx.conf" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} SPA routing configured"
    ((PASS++))
else
    echo -e "${YELLOW}⚠${NC} SPA routing configured"
    ((WARN++))
fi
check_content "frontend/nginx.conf" "gzip on" "Gzip compression enabled"
check_content "frontend/nginx.conf" "X-Frame-Options" "Security headers configured"
echo ""

echo "6. Checking .dockerignore files..."
echo "----------------------------------"
check_content "backend/.dockerignore" "node_modules" "Backend: node_modules ignored"
check_content "backend/.dockerignore" ".env" "Backend: .env files ignored"
check_content "frontend/.dockerignore" "node_modules" "Frontend: node_modules ignored"
check_content "frontend/.dockerignore" ".env" "Frontend: .env files ignored"
echo ""

echo "7. Checking entrypoint script..."
echo "--------------------------------"
check_content "backend/docker-entrypoint.sh" "prisma migrate deploy" "Database migration configured"
check_content "backend/docker-entrypoint.sh" "npm run start:prod" "Production start command"
if [ -f "backend/docker-entrypoint.sh" ]; then
    if [ -x "backend/docker-entrypoint.sh" ]; then
        echo -e "${GREEN}✓${NC} Entrypoint script is executable"
        ((PASS++))
    else
        echo -e "${YELLOW}⚠${NC} Entrypoint script may not be executable (will be fixed in Dockerfile)"
        ((WARN++))
    fi
fi
echo ""

echo "8. Checking documentation..."
echo "---------------------------"
check_content "DOCKER.md" "Quick Start" "Docker documentation exists"
check_content "DOCKER.md" "docker compose up" "Quick start command documented"
check_content "DOCKER.md" "Health Checks" "Health checks documented"
check_content "README.md" "Docker" "README mentions Docker"
check_content "README.md" "make up" "Make commands documented"
echo ""

echo "9. Checking Makefile..."
echo "----------------------"
check_content "Makefile" "up:" "up command defined"
check_content "Makefile" "down:" "down command defined"
check_content "Makefile" "logs:" "logs command defined"
check_content "Makefile" "help:" "help command defined"
echo ""

echo "10. Validating Docker Compose syntax..."
echo "---------------------------------------"
if command -v docker > /dev/null 2>&1; then
    if docker compose config > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} docker-compose.yml syntax is valid"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} docker-compose.yml has syntax errors"
        ((FAIL++))
    fi
else
    echo -e "${YELLOW}⚠${NC} Docker not available, skipping syntax check"
    ((WARN++))
fi
echo ""

# Summary
echo "============================================"
echo "Summary:"
echo "============================================"
echo -e "${GREEN}Passed:  $PASS${NC}"
echo -e "${YELLOW}Warnings: $WARN${NC}"
echo -e "${RED}Failed:  $FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ Docker setup validation successful!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Set up environment files:"
    echo "   cp .env.example .env"
    echo "   cp backend/.env.example backend/.env"
    echo "   cp frontend/.env.example frontend/.env"
    echo ""
    echo "2. Start the application:"
    echo "   make up"
    echo "   # or"
    echo "   docker compose up -d --build"
    echo ""
    echo "3. Check service health:"
    echo "   make health"
    echo "   # or"
    echo "   docker compose ps"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Docker setup has issues that need to be fixed${NC}"
    exit 1
fi
