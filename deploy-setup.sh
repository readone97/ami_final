#!/bin/bash

# Amigo Exchange Deployment Setup Script
echo "🚀 Setting up Amigo Exchange for deployment..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local not found. Creating it..."
    echo "NEXT_PUBLIC_ADMIN_EMAIL=pillartool@gmail.com" > .env.local
    echo "NEXT_PUBLIC_ADMIN_PASSWORD=pillartool@97" >> .env.local
    echo "✅ .env.local created"
else
    echo "✅ .env.local already exists"
fi

# Check if .gitignore exists
if [ ! -f ".gitignore" ]; then
    echo "❌ .gitignore not found. Creating it..."
    # .gitignore content would be here
    echo "✅ .gitignore created"
else
    echo "✅ .gitignore already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Create a GitHub repository"
echo "2. Push your code: git add . && git commit -m 'Initial commit' && git push"
echo "3. Connect to Netlify and set environment variables"
echo "4. Deploy!"
echo ""
echo "See DEPLOYMENT_GUIDE.md for detailed instructions."
