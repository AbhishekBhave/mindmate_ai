#!/bin/bash

# Test Dashboard Fix Implementation
# This script verifies the dashboard data flow and endpoint functionality

echo "🧪 Testing MindMate AI Dashboard Fix"
echo "===================================="
echo ""

# Check if running locally
BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "1️⃣  Testing Dashboard Health Endpoint"
echo "--------------------------------------"
curl -s "${BASE_URL}/api/health/dashboard" | jq '.' || echo "❌ Health endpoint not accessible (ensure you're signed in)"
echo ""

echo "2️⃣  Testing OpenAI Health Endpoint"
echo "-----------------------------------"
curl -s "${BASE_URL}/api/health/openai" | jq '.'
echo ""

echo "3️⃣  Testing Auth Session Endpoint"
echo "----------------------------------"
curl -s "${BASE_URL}/api/health/session" | jq '.'
echo ""

echo "✅ Test script completed!"
echo ""
echo "📝 Next steps:"
echo "   1. Sign in at ${BASE_URL}/sign-in"
echo "   2. Submit a positive entry (e.g., 'I had a great day today!')"
echo "   3. Submit a negative entry (e.g., 'I felt stressed about work today')"
echo "   4. Verify dashboard shows:"
echo "      - Recent Entries (2 entries with different labels)"
echo "      - Progress Insights (2 entries this week)"
echo "      - Mood Graph (at least 2 data points)"
echo "      - Settings button opens panel"
echo "      - Notifications button opens panel"
echo ""

