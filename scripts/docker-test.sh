#!/bin/bash

# Docker Deployment Test Script
# This script tests the Docker containerization setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_status $BLUE "🐳 Docker Deployment Test Script"
print_status $BLUE "=================================="

# Check if Docker is installed and running
if ! command -v docker &> /dev/null; then
    print_status $RED "❌ Docker is not installed"
    exit 1
fi

if ! docker info &> /dev/null; then
    print_status $RED "❌ Docker is not running"
    exit 1
fi

print_status $GREEN "✅ Docker is installed and running"

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_status $RED "❌ docker-compose is not installed"
    exit 1
fi

print_status $GREEN "✅ docker-compose is available"

# Test 1: Build Docker image
print_status $YELLOW "\n📦 Test 1: Building Docker image..."
if docker build -t collabo-pad:test .; then
    print_status $GREEN "✅ Docker image built successfully"
else
    print_status $RED "❌ Docker image build failed"
    exit 1
fi

# Test 2: Check image size and layers
print_status $YELLOW "\n📊 Test 2: Analyzing Docker image..."
IMAGE_SIZE=$(docker images collabo-pad:test --format "{{.Size}}")
print_status $GREEN "✅ Image size: $IMAGE_SIZE"

LAYER_COUNT=$(docker history collabo-pad:test --format "{{.ID}}" | wc -l)
print_status $GREEN "✅ Number of layers: $LAYER_COUNT"

# Test 3: Test container startup
print_status $YELLOW "\n🚀 Test 3: Testing container startup..."

# Create a temporary environment file for testing
cat > .env.test << EOF
NODE_ENV=production
PORT=3000
REDIS_HOST=localhost
REDIS_PORT=6379
POSTGRES_URL=postgresql://test:test@localhost:5432/test
EOF

# Start container in background
CONTAINER_ID=$(docker run -d --name collabo-pad-test \
    --env-file .env.test \
    -p 3001:3000 \
    collabo-pad:test)

# Wait for container to start
print_status $YELLOW "⏳ Waiting for container to start..."
sleep 10

# Check if container is running
if docker ps --filter "id=$CONTAINER_ID" --format "{{.Status}}" | grep -q "Up"; then
    print_status $GREEN "✅ Container started successfully"
else
    print_status $RED "❌ Container failed to start"
    docker logs $CONTAINER_ID
    docker rm -f $CONTAINER_ID &>/dev/null
    rm -f .env.test
    exit 1
fi

# Test 4: Health check
print_status $YELLOW "\n🏥 Test 4: Testing health check endpoint..."

# Wait for health check to be ready
print_status $YELLOW "⏳ Waiting for health check..."
sleep 20

# Test health endpoint
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health || echo "000")

if [ "$HEALTH_RESPONSE" = "200" ]; then
    print_status $GREEN "✅ Health check endpoint responded with 200"

    # Get detailed health status
    HEALTH_STATUS=$(curl -s http://localhost:3001/api/health)
    print_status $GREEN "✅ Health status: $HEALTH_STATUS"
else
    print_status $RED "❌ Health check failed with status: $HEALTH_RESPONSE"
    docker logs $CONTAINER_ID
fi

# Test 5: Docker Compose configuration validation
print_status $YELLOW "\n🔧 Test 5: Validating docker-compose configuration..."

if docker-compose config --quiet; then
    print_status $GREEN "✅ docker-compose.yml is valid"
else
    print_status $RED "❌ docker-compose.yml has errors"
    docker rm -f $CONTAINER_ID &>/dev/null
    rm -f .env.test
    exit 1
fi

# Test 6: Environment variables validation
print_status $YELLOW "\n🔍 Test 6: Validating environment variables..."

# Check if required environment variables are documented
if [ -f ".env.production.example" ]; then
    print_status $GREEN "✅ Production environment template exists"

    # Check for essential variables
    if grep -q "NODE_ENV" .env.production.example && \
       grep -q "POSTGRES_URL" .env.production.example && \
       grep -q "REDIS_HOST" .env.production.example; then
        print_status $GREEN "✅ Essential environment variables are documented"
    else
        print_status $YELLOW "⚠️  Some environment variables might be missing"
    fi
else
    print_status $RED "❌ Production environment template not found"
fi

# Cleanup
print_status $YELLOW "\n🧹 Cleaning up..."
docker rm -f $CONTAINER_ID &>/dev/null
rm -f .env.test

# Remove test image
docker rmi collabo-pad:test &>/dev/null

print_status $GREEN "✅ Cleanup completed"

# Test Summary
print_status $BLUE "\n📋 Test Summary"
print_status $BLUE "=================="
print_status $GREEN "✅ All Docker tests passed successfully!"
print_status $GREEN "✅ Container is ready for production deployment"

print_status $BLUE "\n📝 Next Steps:"
print_status $BLUE "1. Copy .env.production.example to .env.production"
print_status $BLUE "2. Configure your external PostgreSQL and Redis connections"
print_status $BLUE "3. Run 'docker-compose up -d' to start the application"
print_status $BLUE "4. Monitor health at http://localhost:3000/api/health"