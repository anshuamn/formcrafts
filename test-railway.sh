#!/bin/bash
# Test if login page loads correctly on Railway deployment

URL="${1:-https://formcrafts-production.up.railway.app}"

echo "🔍 Testing login page at: $URL"
echo ""

# Test root path (should redirect to login or serve login)
echo "Testing root path ($URL/)..."
curl -s -o /dev/null -w "Status: %{http_code}\n" "$URL/"

# Test login path
echo "Testing login path ($URL/login)..."
curl -s -o /dev/null -w "Status: %{http_code}\n" "$URL/login"

# Test API health
echo "Testing API health ($URL/api/health)..."
curl -s "$URL/api/health" | jq . 2>/dev/null || curl -s "$URL/api/health"

echo ""
echo "🧪 Testing login POST..."
TOKEN_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password","remember":true}' \
  "$URL/api/auth/login")

echo "Login API response:"
echo "$TOKEN_RESPONSE" | jq . 2>/dev/null || echo "$TOKEN_RESPONSE"

# Extract token if successful
TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
if [ -n "$TOKEN" ]; then
    echo ""
    echo "✅ Login successful! Token: ${TOKEN:0:20}..."
    
    echo ""
    echo "Testing admin access with token..."
    curl -s -o /dev/null -w "Admin Status: %{http_code}\n" "$URL/admin?token=$TOKEN"
else
    echo "❌ Login failed"
fi