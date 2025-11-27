#!/bin/bash

# Family Sync - Quick Setup Script
# This script helps new developers get started quickly

echo "🚀 Family Sync - Quick Setup"
echo "======================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Node.js is installed
check_node() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        print_status "Node.js found: $NODE_VERSION"
        
        # Check if version is 18 or higher
        NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | cut -d'v' -f2)
        if [ "$NODE_MAJOR_VERSION" -ge 18 ]; then
            print_status "Node.js version is compatible (18+)"
        else
            print_warning "Node.js version should be 18 or higher. Current: $NODE_VERSION"
        fi
    else
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        print_info "Visit: https://nodejs.org/"
        exit 1
    fi
}

# Check if npm is available
check_npm() {
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm -v)
        print_status "npm found: $NPM_VERSION"
    else
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
}

# Setup backend
setup_backend() {
    echo ""
    print_info "Setting up backend server..."
    
    cd services/backend-server
    
    if [ ! -f "package.json" ]; then
        print_error "Backend package.json not found!"
        exit 1
    fi
    
    print_info "Installing backend dependencies..."
    npm install
    
    if [ $? -eq 0 ]; then
        print_status "Backend dependencies installed successfully"
    else
        print_error "Failed to install backend dependencies"
        exit 1
    fi
    
    # Setup environment file
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_warning "Created .env file from .env.example"
            print_warning "Please edit services/backend-server/.env with your configuration!"
        else
            print_error ".env.example not found in backend directory"
        fi
    else
        print_info ".env file already exists"
    fi
    
    cd ../..
}

# Setup frontend
setup_frontend() {
    echo ""
    print_info "Setting up frontend client..."
    
    cd client
    
    if [ ! -f "package.json" ]; then
        print_error "Client package.json not found!"
        exit 1
    fi
    
    print_info "Installing frontend dependencies..."
    npm install
    
    if [ $? -eq 0 ]; then
        print_status "Frontend dependencies installed successfully"
    else
        print_error "Failed to install frontend dependencies"
        exit 1
    fi
    
    # Setup environment file
    if [ ! -f ".env.local" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env.local
            print_warning "Created .env.local file from .env.example"
            print_warning "Please edit client/.env.local with your configuration!"
        else
            print_error ".env.example not found in client directory"
        fi
    else
        print_info ".env.local file already exists"
    fi
    
    cd ..
}

# Display next steps
show_next_steps() {
    echo ""
    echo "======================================="
    print_status "Setup completed! 🎉"
    echo ""
    print_info "Next steps:"
    echo ""
    echo "1. Configure your environment files:"
    echo "   - Edit services/backend-server/.env"
    echo "   - Edit client/.env.local"
    echo ""
    echo "2. Make sure you have MongoDB running (local or Atlas)"
    echo ""
    echo "3. Set up your AWS S3 bucket for file uploads"
    echo ""
    echo "4. Start the development servers:"
    echo ""
    echo "   Terminal 1 - Backend:"
    echo "   cd services/backend-server"
    echo "   npm run dev"
    echo ""
    echo "   Terminal 2 - Frontend:"
    echo "   cd client"
    echo "   npm run dev"
    echo ""
    print_info "The app will be available at:"
    print_info "Frontend: http://localhost:3000"
    print_info "Backend API: http://localhost:4000"
    echo ""
    print_info "For detailed setup instructions, see README.md"
    echo "======================================="
}

# Main execution
main() {
    check_node
    check_npm
    setup_backend
    setup_frontend
    show_next_steps
}

# Run the main function
main