#!/bin/bash

# Stop script on error
set -e

echo "Setting up VPS environment..."

# 1. Install Nginx
echo "Installing Nginx..."
sudo apt-get update
sudo apt-get install -y nginx

# 2. Configure Nginx
echo "Configuring Nginx..."
# Backup default config if it exists
if [ -f /etc/nginx/sites-enabled/default ]; then
    sudo mv /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/default.bak
fi

# Copy our config
sudo cp nginx.conf /etc/nginx/sites-available/chineselearn
# Enable site
sudo ln -sf /etc/nginx/sites-available/chineselearn /etc/nginx/sites-enabled/

# 3. Test and Reload Nginx
echo "Testing Nginx configuration..."
sudo nginx -t
sudo systemctl reload nginx

echo "VPS Setup Complete! Nginx is running."
