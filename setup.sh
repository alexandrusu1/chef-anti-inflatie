#!/bin/bash

# Chef Anti-Inflație - Setup Script
# Run this script to set up the application for production

set -e

echo "🍳 Chef Anti-Inflație - Production Setup"
echo "========================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if running as root for systemd setup
if [ "$1" == "--systemd" ]; then
    if [ "$EUID" -ne 0 ]; then
        print_error "Please run with sudo for systemd setup"
        exit 1
    fi
fi

# Setup Backend
setup_backend() {
    echo ""
    echo "Setting up Backend..."
    cd "$PROJECT_DIR/backend"
    
    # Create virtual environment if not exists
    if [ ! -d "venv" ]; then
        python -m venv venv
        print_status "Created virtual environment"
    fi
    
    # Activate and install dependencies
    source venv/bin/activate
    pip install -q --upgrade pip
    pip install -q -r requirements.txt
    print_status "Installed Python dependencies"
    
    # Create data directory
    mkdir -p data
    print_status "Created data directory"
    
    # Check for .env file
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Creating template..."
        echo "GITHUB_TOKEN=your_github_token_here" > .env
        print_warning "Please edit backend/.env and add your GITHUB_TOKEN"
    else
        print_status ".env file exists"
    fi
    
    deactivate
}

# Setup Frontend
setup_frontend() {
    echo ""
    echo "Setting up Frontend..."
    cd "$PROJECT_DIR/frontend"
    
    # Check for Node.js
    if ! command -v npm &> /dev/null; then
        print_error "npm not found. Please install Node.js first."
        exit 1
    fi
    
    # Install dependencies
    npm install --silent
    print_status "Installed Node.js dependencies"
    
    # Build for production
    npm run build
    print_status "Built frontend for production"
}

# Setup systemd services
setup_systemd() {
    echo ""
    echo "Setting up systemd services..."
    
    # Copy service files
    cp "$PROJECT_DIR/chef-backend.service" /etc/systemd/system/
    cp "$PROJECT_DIR/chef-frontend.service" /etc/systemd/system/
    
    # Reload systemd
    systemctl daemon-reload
    
    # Enable services
    systemctl enable chef-backend.service
    systemctl enable chef-frontend.service
    
    print_status "Systemd services installed and enabled"
    
    echo ""
    echo "To start the services:"
    echo "  sudo systemctl start chef-backend"
    echo "  sudo systemctl start chef-frontend"
}

# Setup with Docker
setup_docker() {
    echo ""
    echo "Building Docker containers..."
    cd "$PROJECT_DIR"
    
    # Check for docker-compose
    if ! command -v docker-compose &> /dev/null && ! command -v docker &> /dev/null; then
        print_error "Docker not found. Please install Docker first."
        exit 1
    fi
    
    # Create .env file for docker-compose if not exists
    if [ ! -f ".env" ]; then
        echo "GITHUB_TOKEN=your_github_token_here" > .env
        print_warning "Created .env file. Please add your GITHUB_TOKEN"
    fi
    
    # Build containers
    docker-compose build
    print_status "Docker containers built"
    
    echo ""
    echo "To start with Docker:"
    echo "  docker-compose up -d"
    echo ""
    echo "To start with nginx proxy:"
    echo "  docker-compose --profile with-proxy up -d"
}

# Main menu
main() {
    echo ""
    echo "Choose setup method:"
    echo "1) Local development (venv + npm)"
    echo "2) Docker deployment"
    echo "3) Systemd services (requires sudo)"
    echo "4) All of the above"
    echo ""
    read -p "Enter choice [1-4]: " choice
    
    case $choice in
        1)
            setup_backend
            setup_frontend
            ;;
        2)
            setup_docker
            ;;
        3)
            setup_backend
            setup_frontend
            setup_systemd
            ;;
        4)
            setup_backend
            setup_frontend
            setup_docker
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
    
    echo ""
    echo "========================================"
    echo -e "${GREEN}✓ Setup complete!${NC}"
    echo ""
    echo "Quick start commands:"
    echo ""
    echo "  Local development:"
    echo "    Backend:  cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000"
    echo "    Frontend: cd frontend && npm run dev"
    echo ""
    echo "  Docker:"
    echo "    docker-compose up -d"
    echo ""
    echo "Access the app at:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend API: http://localhost:8000"
    echo "  API Docs: http://localhost:8000/docs"
    echo ""
}

# Run based on arguments
if [ "$1" == "--backend" ]; then
    setup_backend
elif [ "$1" == "--frontend" ]; then
    setup_frontend
elif [ "$1" == "--docker" ]; then
    setup_docker
elif [ "$1" == "--systemd" ]; then
    setup_backend
    setup_frontend
    setup_systemd
else
    main
fi
