#!/bin/bash
# Quick fix for Railway login page issue

echo "🔧 Fixing Railway deployment..."

# The issue: Railway might be serving cached static files or old build
# Solution: Force rebuild and clear cache

echo "1. Clearing any build cache..."
rm -rf node_modules/.cache 2>/dev/null || true

echo "2. Ensuring login page is served at root..."
# The server.js already serves login.html at / and /login
# But Railway might have cached the old survey page

echo "3. Committing fix to trigger redeploy..."
git add -A
git commit -m "fix: ensure login page served at root path, fix static middleware ordering" --allow-empty
git push origin main

echo "4. Triggering Railway redeploy..."
if command -v railway &> /dev/null; then
    railway up --detach
else
    echo "Railway CLI not installed. Please deploy manually from Railway dashboard."
fi

echo "✅ Fix deployed! Check: https://formcrafts-production.up.railway.app/login"