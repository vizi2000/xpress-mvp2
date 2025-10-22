#!/bin/bash
# Environment Variable Injection Script
# This script replaces placeholders in config.local.js with actual env vars

set -e

echo "🔧 Injecting environment variables into config.local.js..."

CONFIG_FILE="${CONFIG_FILE:-/usr/share/nginx/html/config.local.js}"

# Check if config file exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Config file not found: $CONFIG_FILE"
    exit 1
fi

# Function to safely replace placeholder
replace_placeholder() {
    local placeholder=$1
    local value=$2

    if [ -z "$value" ]; then
        echo "⚠️  Warning: $placeholder is empty"
        return
    fi

    # Escape special characters for sed
    value_escaped=$(printf '%s\n' "$value" | sed 's/[&/\]/\\&/g')

    # Replace placeholder (macOS compatible)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|${placeholder}|${value_escaped}|g" "$CONFIG_FILE"
    else
        sed -i "s|${placeholder}|${value_escaped}|g" "$CONFIG_FILE"
    fi
    echo "✅ Replaced $placeholder"
}

# Replace all placeholders
replace_placeholder "__GOOGLE_MAPS_API_KEY__" "${GOOGLE_MAPS_API_KEY}"
replace_placeholder "__LOCATIONIQ_API_KEY__" "${LOCATIONIQ_API_KEY}"
replace_placeholder "__XPRESS_API_USERNAME__" "${XPRESS_API_USERNAME}"
replace_placeholder "__XPRESS_API_PASSWORD__" "${XPRESS_API_PASSWORD}"
replace_placeholder "__REVOLUT_API_KEY__" "${REVOLUT_API_KEY:-YOUR_REVOLUT_MERCHANT_API_KEY}"
replace_placeholder "__REVOLUT_WEBHOOK_SECRET__" "${REVOLUT_WEBHOOK_SECRET:-YOUR_WEBHOOK_SECRET}"
replace_placeholder "__REVOLUT_PUBLIC_KEY__" "${REVOLUT_PUBLIC_KEY:-YOUR_REVOLUT_PUBLIC_KEY}"
replace_placeholder "__REVOLUT_ENVIRONMENT__" "${REVOLUT_ENVIRONMENT:-sandbox}"
replace_placeholder "__OPENROUTER_API_KEY__" "${OPENROUTER_API_KEY}"

echo "✅ Environment variables injected successfully"

# Show config (with masked secrets for debugging)
echo "📋 Config preview (secrets masked):"
grep -v "password\|apiKey\|secret" "$CONFIG_FILE" || true

echo "🚀 Ready to start application"
