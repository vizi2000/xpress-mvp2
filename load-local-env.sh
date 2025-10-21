#!/bin/bash
# Local Development Environment Loader
# Loads .env.local and creates config.local.js for browser

set -e

ENV_FILE=".env.local"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ .env.local not found!"
    echo "💡 Copy .env.template to .env.local and fill in your credentials"
    exit 1
fi

echo "🔧 Loading environment from $ENV_FILE..."

# Source the env file
export $(grep -v '^#' $ENV_FILE | xargs)

# Run inject script
CONFIG_FILE="config.local.js" ./inject-env.sh

echo "✅ Local environment configured"
echo "🚀 Start development server: python3 -m http.server 8080"
