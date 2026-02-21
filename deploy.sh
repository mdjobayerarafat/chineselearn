#!/bin/bash

# Exit on error
set -e

echo "Starting deployment..."

# Pull latest changes from git
echo "Pulling latest changes..."
git pull origin main

# Build and restart containers
echo "Building and restarting containers..."
# Use --build to ensure images are updated
docker-compose up -d --build

# Clean up unused images to save space
echo "Cleaning up..."
docker image prune -f

echo "Deployment complete! Application is running."
echo "Frontend: http://20.220.172.139:3000"
echo "Backend: http://20.220.172.139:8080"
