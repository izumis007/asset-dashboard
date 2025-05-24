#!/bin/bash

echo "Checking and creating missing directories and files..."

# Function to create directory if it doesn't exist
create_dir_if_missing() {
    if [ ! -d "$1" ]; then
        echo "Creating directory: $1"
        mkdir -p "$1"
    else
        echo "Directory already exists: $1"
    fi
}

# Function to create file if it doesn't exist
create_file_if_missing() {
    if [ ! -f "$1" ]; then
        echo "Creating file: $1"
        touch "$1"
    else
        echo "File already exists: $1"
    fi
}

# Create directories
create_dir_if_missing "backend/app/models"
create_dir_if_missing "backend/app/schemas"
create_dir_if_missing "backend/app/api"
create_dir_if_missing "backend/app/services"
create_dir_if_missing "backend/app/tasks"
create_dir_if_missing "frontend/src/app/dashboard"
create_dir_if_missing "frontend/src/app/holdings"
create_dir_if_missing "frontend/src/app/btc-trades"
create_dir_if_missing "frontend/src/app/settings"
create_dir_if_missing "frontend/src/components/charts"
create_dir_if_missing "frontend/src/components/forms"
create_dir_if_missing "frontend/src/components/ui"
create_dir_if_missing "frontend/src/lib"
create_dir_if_missing "frontend/src/types"
create_dir_if_missing "scraper/src"
create_dir_if_missing "nginx"
create_dir_if_missing "scripts"

# Create __init__.py files if missing
create_file_if_missing "backend/app/__init__.py"
create_file_if_missing "backend/app/models/__init__.py"
create_file_if_missing "backend/app/schemas/__init__.py"
create_file_if_missing "backend/app/api/__init__.py"
create_file_if_missing "backend/app/services/__init__.py"
create_file_if_missing "backend/app/tasks/__init__.py"

# Create .dockerignore files only if they don't exist
if [ ! -f "backend/.dockerignore" ]; then
    echo "Creating backend/.dockerignore"
    cat > backend/.dockerignore << EOF
__pycache__
*.pyc
*.pyo
*.pyd
.Python
env/
venv/
.venv
.env
.pytest_cache/
.coverage
*.log
EOF
fi

if [ ! -f "frontend/.dockerignore" ]; then
    echo "Creating frontend/.dockerignore"
    cat > frontend/.dockerignore << EOF
node_modules
.next
.env.local
.env
npm-debug.log*
yarn-debug.log*
yarn-error.log*
EOF
fi

if [ ! -f "scraper/.dockerignore" ]; then
    echo "Creating scraper/.dockerignore"
    cat > scraper/.dockerignore << EOF
node_modules
npm-debug.log*
.env
EOF
fi

# Create .gitignore only if it doesn't exist
if [ ! -f ".gitignore" ]; then
    echo "Creating .gitignore"
    cat > .gitignore << EOF
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/
.venv

# Node
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.next/
out/
dist/

# Environment variables
.env
.env.local
.env.*.local

# Database
*.db
*.sqlite
postgres_data/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Docker
*.log
EOF
fi

echo ""
echo "✅ Setup check completed!"
echo ""
echo "Missing files check:"
echo "==================="

# Check for critical files
check_file() {
    if [ -f "$1" ]; then
        echo "✓ $1"
    else
        echo "✗ $1 (MISSING!)"
    fi
}

check_file "backend/requirements.txt"
check_file "backend/Dockerfile"
check_file "frontend/package.json"
check_file "frontend/Dockerfile"
check_file "scraper/package.json"
check_file "scraper/Dockerfile"
check_file "docker-compose.yml"
check_file ".env"
check_file "Caddyfile"

echo ""
echo "Next steps:"
echo "1. Ensure all missing files (marked with ✗) are created"
echo "2. Check that .env file has required variables"
echo "3. Run: docker-compose up -d"