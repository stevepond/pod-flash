#!/bin/bash

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Build and start all services
echo "Building and starting services..."
docker-compose up --build

# Handle cleanup on script termination
trap 'docker-compose down' EXIT 