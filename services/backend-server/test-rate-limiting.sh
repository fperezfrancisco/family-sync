#!/bin/bash

echo "🚀 Testing Rate Limiting on Family Sync API"
echo "============================================="
echo ""

BASE_URL="http://localhost:4000"

echo "🧪 TESTING GENERAL RATE LIMIT (Test endpoint: 3 requests per minute)"
echo "Making 4 rapid requests to trigger rate limiting..."
echo ""

for i in {1..4}; do
  echo "📍 Request $i/4 to /test-rate-limit:"
  
  # Make request and capture both status code and response
  response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL/test-rate-limit")
  
  # Extract the status code and body
  status_code=$(echo $response | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
  body=$(echo $response | sed 's/HTTPSTATUS:[0-9]*$//')
  
  if [ "$status_code" = "429" ]; then
    echo "❌ Rate Limited! Status: $status_code"
    echo "   Response: $body"
  elif [ "$status_code" = "200" ]; then
    echo "✅ Success! Status: $status_code"
    echo "   Response: $body"
  else
    echo "⚠️  Unexpected status: $status_code"
    echo "   Response: $body"
  fi
  
  echo ""
  
  # Small delay between requests (except last one)
  if [ $i -lt 4 ]; then
    sleep 0.5
  fi
done

echo ""
echo "⏳ Waiting 2 seconds before auth tests..."
sleep 2

echo ""
echo "🔐 TESTING AUTH RATE LIMIT (Auth endpoints: 5 requests per 15 minutes)"
echo "Making 6 rapid requests to trigger rate limiting..."
echo ""

for i in {1..6}; do
  echo "📍 Auth request $i/6 to /auth/test:"
  
  # Try to hit an auth endpoint that exists or create a test endpoint
  response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL/auth/register" -X POST -H "Content-Type: application/json" -d '{}')
  
  status_code=$(echo $response | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
  body=$(echo $response | sed 's/HTTPSTATUS:[0-9]*$//')
  
  if [ "$status_code" = "429" ]; then
    echo "❌ Rate Limited! Status: $status_code"
    echo "   Response: $body"
  elif [ "$status_code" = "400" ] || [ "$status_code" = "422" ]; then
    echo "✅ Request processed (validation error expected)! Status: $status_code"
    echo "   Response: ${body:0:100}..."
  else
    echo "ℹ️  Status: $status_code"
    echo "   Response: ${body:0:100}..."
  fi
  
  echo ""
  
  # Small delay between requests (except last one)
  if [ $i -lt 6 ]; then
    sleep 0.3
  fi
done

echo "🏁 Rate limiting tests completed!"
echo ""
echo "📊 What should happen:"
echo "   • First 3 test requests: ✅ Success"
echo "   • 4th test request: ❌ Rate limited (429)"
echo "   • First 5 auth requests: ✅ Processed (may have validation errors)"
echo "   • 6th auth request: ❌ Rate limited (429)"
echo ""
echo "💡 To reset limits: Wait for time window to expire or restart server"