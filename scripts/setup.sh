#!/usr/bin/env bash
# MyCode Development Setup Script
# This script sets up the development environment on a new machine

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo ""
echo "🚀 MyCode Development Setup"
echo "==========================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

info() { echo -e "${BLUE}ℹ${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; }

# Check if Nix is installed and has flakes enabled
check_nix() {
    if command -v nix &> /dev/null; then
        if nix --version 2>&1 | grep -q "nix"; then
            success "Nix is installed"
            return 0
        fi
    fi
    return 1
}

# Check if Node.js is installed
check_node() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        success "Node.js is installed: $NODE_VERSION"
        return 0
    fi
    return 1
}

# Check if npm is installed
check_npm() {
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        success "npm is installed: $NPM_VERSION"
        return 0
    fi
    return 1
}

# Install dependencies
install_deps() {
    info "Installing project dependencies..."
    cd "$PROJECT_DIR"
    npm install
    success "Dependencies installed"
}

# Main setup flow
main() {
    cd "$PROJECT_DIR"
    
    echo "Checking development environment..."
    echo ""

    # Method 1: Nix (preferred)
    if check_nix; then
        echo ""
        info "Nix detected! You can use the flake for a complete dev environment:"
        echo ""
        echo "  nix develop"
        echo ""
        echo "This will give you Node.js, npm, and all Electron dependencies."
        echo ""
        
        read -p "Enter nix develop shell now? (Y/n) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
            exec nix develop
        fi
    fi

    # Method 2: System Node.js
    echo ""
    info "Checking for system Node.js installation..."
    
    if check_node && check_npm; then
        echo ""
        install_deps
        echo ""
        success "Setup complete! You can now run:"
        echo ""
        echo "  npm run dev    - Start development mode"
        echo "  npm run build  - Build for production"
        echo "  npm start      - Run the app"
        echo ""
    else
        echo ""
        warn "Node.js/npm not found on this system."
        echo ""
        echo "Installation options:"
        echo ""
        echo "  1. Install Nix (recommended for reproducible environments):"
        echo "     curl --proto '=https' --tlsv1.2 -sSf -L https://install.determinate.systems/nix | sh -s -- install"
        echo "     Then run: nix develop"
        echo ""
        echo "  2. Install Node.js via package manager:"
        echo "     Ubuntu/Debian: sudo apt install nodejs npm"
        echo "     Fedora:        sudo dnf install nodejs npm"
        echo "     Arch:          sudo pacman -S nodejs npm"
        echo "     macOS:         brew install node"
        echo ""
        echo "  3. Install via nvm (Node Version Manager):"
        echo "     curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash"
        echo "     Then: nvm install 20 && nvm use 20"
        echo ""
        exit 1
    fi
}

main "$@"
