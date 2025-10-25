#!/bin/bash
# Test script for AI Entry Analysis API
# Run: bash test-api.sh

echo "🧪 Testing MindMate AI Entry Analysis API"
echo "=========================================="
echo ""

# Check if API is running
echo "1️⃣ Checking API health..."
HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/health/openai)
if echo "$HEALTH_RESPONSE" | grep -q '"status":"healthy"'; then
    echo "✅ API is healthy"
    echo "$HEALTH_RESPONSE" | jq '.' 2>/dev/null || echo "$HEALTH_RESPONSE"
else
    echo "❌ API is not healthy"
    echo "$HEALTH_RESPONSE"
    exit 1
fi

echo ""
echo "2️⃣ Testing negative entry analysis..."
NEGATIVE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/analyze-entry \
    -H "Content-Type: application/json" \
    -d '{
        "entryText": "I failed my exam and feel overwhelmed"
    }')

echo "Response:"
echo "$NEGATIVE_RESPONSE" | jq '.' 2>/dev/null || echo "$NEGATIVE_RESPONSE"

if echo "$NEGATIVE_RESPONSE" | grep -qi "failed\|overwhelm"; then
    echo "✅ Response references entry content"
else
    echo "⚠️ Response may be generic"
fi

echo ""
echo "3️⃣ Testing positive entry analysis..."
POSITIVE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/analyze-entry \
    -H "Content-Type: application/json" \
    -d '{
        "entryText": "I landed an internship and feel proud"
    }')

echo "Response:"
echo "$POSITIVE_RESPONSE" | jq '.' 2>/dev/null || echo "$POSITIVE_RESPONSE"

if echo "$POSITIVE_RESPONSE" | grep -qi "internship\|proud"; then
    echo "✅ Response references entry content"
else
    echo "⚠️ Response may be generic"
fi

echo ""
echo "4️⃣ Comparing responses..."
NEGATIVE_SENTIMENT=$(echo "$NEGATIVE_RESPONSE" | jq -r '.data.sentiment' 2>/dev/null)
POSITIVE_SENTIMENT=$(echo "$POSITIVE_RESPONSE" | jq -r '.data.sentiment' 2>/dev/null)

echo "Negative entry sentiment: $NEGATIVE_SENTIMENT"
echo "Positive entry sentiment: $POSITIVE_SENTIMENT"

if [ "$NEGATIVE_SENTIMENT" != "$POSITIVE_SENTIMENT" ]; then
    echo "✅ Sentiments differ correctly"
else
    echo "⚠️ Both entries have same sentiment"
fi

echo ""
echo "✨ Testing complete!"

