#!/bin/bash

echo "🚀 Micro-SaaS Monorepo Setup"
echo "=============================="
echo ""

# Check for pnpm
if ! command -v pnpm &> /dev/null
then
    echo "❌ pnpm is not installed. Please install it first:"
    echo "   npm install -g pnpm"
    exit 1
fi

echo "✅ pnpm found"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

echo ""
echo "✅ Dependencies installed"
echo ""

# Create .env.local files if they don't exist
echo "📝 Setting up environment files..."

for app in cronguard formvault snipshot; do
    if [ ! -f "apps/$app/.env.local" ]; then
        cp .env.example "apps/$app/.env.local"
        echo "   Created apps/$app/.env.local"
    else
        echo "   apps/$app/.env.local already exists"
    fi
done

echo ""
echo "✅ Environment files created"
echo ""

echo "⚠️  IMPORTANT: Edit the .env.local files in each app directory with your credentials:"
echo "   - apps/cronguard/.env.local"
echo "   - apps/formvault/.env.local"
echo "   - apps/snipshot/.env.local"
echo ""

echo "📚 Next steps:"
echo "   1. Configure Firebase (see DEPLOYMENT.md)"
echo "   2. Set up Stripe products and webhooks"
echo "   3. Configure Resend for emails"
echo "   4. For SnipShot: Set up Upstash Redis and Browserless"
echo "   5. Fill in all .env.local files"
echo "   6. Run 'pnpm dev' to start all apps"
echo ""

echo "🎉 Setup complete!"

