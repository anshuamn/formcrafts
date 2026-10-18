#!/bin/bash
# FormCrafts Deployment Script
# Usage: ./deploy.sh [production|staging]

set -e

ENV=${1:-production}
COMPOSE_FILE="docker-compose.yml"

if [ "$ENV" = "staging" ]; then
    COMPOSE_FILE="docker-compose.staging.yml"
fi

echo "🚀 Deploying FormCrafts to $ENV..."

# Pull latest images
echo "📥 Pulling latest images..."
docker compose -f $COMPOSE_FILE pull

# Stop and remove old containers
echo "🛑 Stopping old containers..."
docker compose -f $COMPOSE_FILE down

# Start new containers
echo "▶️ Starting new containers..."
docker compose -f $COMPOSE_FILE up -d

# Wait for health check
echo "⏳ Waiting for health check..."
sleep 10

# Check health
for i in {1..30}; do
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "✅ Health check passed!"
        break
    fi
    echo "⏳ Waiting... ($i/30)"
    sleep 2
done

# Cleanup old images
echo "🧹 Cleaning up old images..."
docker image prune -f

echo "✅ Deployment complete!"
echo "🌐 Application running at http://localhost:3000"