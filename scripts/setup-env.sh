#!/bin/bash

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "GitHub CLI is not installed. Please install it first."
    exit 1
fi

# Check if logged in to GitHub
if ! gh auth status &> /dev/null; then
    echo "Please login to GitHub first using: gh auth login"
    exit 1
fi

# Function to set a secret if it doesn't exist
set_secret() {
    local name=$1
    local value=$2
    
    if [ -z "$value" ]; then
        read -p "Enter value for $name: " value
    fi
    
    echo "Setting $name..."
    gh secret set "$name" -b"$value" || {
        echo "Failed to set $name"
        return 1
    }
}

# Required secrets
declare -a secrets=(
    "CODECOV_TOKEN"
    "SNYK_TOKEN"
    "SUPABASE_URL"
    "SUPABASE_ANON_KEY"
    "SENTRY_DSN"
    "SENTRY_AUTH_TOKEN"
    "SENTRY_ORG"
    "SENTRY_PROJECT"
    "NETLIFY_AUTH_TOKEN"
    "NETLIFY_SITE_ID"
    "AWS_ACCESS_KEY_ID"
    "AWS_SECRET_ACCESS_KEY"
)

# Set each secret
for secret in "${secrets[@]}"; do
    set_secret "$secret" || exit 1
done

# Create .env file for local development
echo "Creating .env file..."
cat > .env << EOL
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
VITE_SENTRY_DSN=$SENTRY_DSN
EOL

# Create .env.production file
echo "Creating .env.production file..."
cat > .env.production << EOL
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
VITE_SENTRY_DSN=$SENTRY_DSN
EOL

# Make the script executable
chmod +x scripts/setup-env.sh

echo "Environment setup complete!"
echo "Next steps:"
echo "1. Run 'npm install' to install dependencies"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Run 'npm run build' to create a production build" 