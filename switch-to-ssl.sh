#!/bin/bash

echo "Switching to HTTPS configuration..."

# Stop current containers
docker-compose down

# Start with SSL configuration
docker-compose -f docker-compose.ssl.yml up -d

echo "HTTPS configuration started!"
echo "Your app will be available at: https://app.novaracorporation.com"
echo "Apple Pay and Google Pay should now work!"