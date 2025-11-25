#!/bin/bash

# Digital Ocean Droplet Setup Script
# Run this script on a fresh Ubuntu 22.04 droplet
# Usage: bash setup-droplet.sh

set -e

echo "🚀 Starting Digital Ocean Droplet Setup..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Update system
echo -e "${YELLOW}📦 Updating system packages...${NC}"
apt update && apt upgrade -y
apt install -y curl wget git build-essential

# Install Node.js 18.x
echo -e "${YELLOW}📦 Installing Node.js 18.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verify Node.js
echo -e "${GREEN}✅ Node.js version: $(node --version)${NC}"
echo -e "${GREEN}✅ npm version: $(npm --version)${NC}"

# Install PM2
echo -e "${YELLOW}📦 Installing PM2...${NC}"
npm install -g pm2

# Install Ollama
echo -e "${YELLOW}📦 Installing Ollama...${NC}"
curl -fsSL https://ollama.ai/install.sh | sh

# Create Ollama systemd service
echo -e "${YELLOW}📦 Setting up Ollama service...${NC}"
cat > /etc/systemd/system/ollama.service << 'EOF'
[Unit]
Description=Ollama Service
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/ollama serve
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable ollama
systemctl start ollama

# Wait for Ollama to start
sleep 5

# Download models
echo -e "${YELLOW}📦 Downloading Ollama models...${NC}"
echo "This may take a while (5-10 minutes)..."
ollama pull llama3.2:1b
echo -e "${GREEN}✅ Downloaded llama3.2:1b${NC}"

# Ask about vision model
read -p "Download llava:7b vision model? (4GB, y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    ollama pull llava:7b
    echo -e "${GREEN}✅ Downloaded llava:7b${NC}"
fi

# Setup swap space (4GB)
echo -e "${YELLOW}📦 Setting up swap space...${NC}"
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Install Nginx
echo -e "${YELLOW}📦 Installing Nginx...${NC}"
apt install -y nginx

# Setup firewall
echo -e "${YELLOW}📦 Configuring firewall...${NC}"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# Verify services
echo -e "${YELLOW}🔍 Verifying services...${NC}"
echo -e "${GREEN}✅ Ollama status:${NC}"
systemctl status ollama --no-pager | head -n 3

echo -e "${GREEN}✅ Nginx status:${NC}"
systemctl status nginx --no-pager | head -n 3

echo -e "${GREEN}✅ Swap space:${NC}"
free -h | grep Swap

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Clone your repository: git clone YOUR_REPO_URL"
echo "2. Install dependencies: cd ASLI-STUD-BACK && npm install"
echo "3. Create .env file with your configuration"
echo "4. Start app with PM2: pm2 start index.js --name asli-backend"
echo "5. Configure Nginx (see DIGITAL_OCEAN_DEPLOYMENT.md)"
echo ""
echo "Check models: ollama list"
echo "Check Ollama: curl http://localhost:11434/api/tags"

