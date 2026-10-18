#!/bin/bash
# Force redeploy to Railway

echo "🚀 Forcing fresh Railway deployment..."

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Login to Railway (if not already)
echo "🔐 Logging into Railway..."
railway login

# Link to project (if not already linked)
echo "🔗 Linking to project..."
railway link formcrafts-production

# Force redeploy by making a trivial change
echo "🔄 Forcing fresh deployment..."
echo "// Force redeploy $(date)" >> server.js
git add server.js
git commit -m "chore: force redeploy $(date)"
git push origin main

# Trigger Railway deploy
echo "🚀 Triggering Railway deployment..."
railway up --detach

echo "✅ Deployment triggered! Check Railway dashboard for status."
echo "🌐 Your app will be at: https://formcrafts-production.up.railway.app"
echo "🔗 Login page: https://formcrafts-production.up.railway.app/login"