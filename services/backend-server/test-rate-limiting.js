#!/usr/bin/env node

/**
 * Rate Limiting Test Script
 *
 * This script demonstrates the rate limiting in action by making multiple requests
 * to both general endpoints and auth endpoints.
 */

import fetch from "node-fetch";

const BASE_URL = "http://localhost:4000";

async function makeRequest(url, description) {
  try {
    const response = await fetch(url);
    const data = await response.text();

    console.log(`\n📍 ${description}`);
    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.status === 429) {
      console.log(`❌ Rate Limited! ${data}`);

      // Try to parse JSON error response
      try {
        const jsonData = JSON.parse(data);
        if (jsonData.retryAfter) {
          console.log(`⏱️  Retry after: ${jsonData.retryAfter} seconds`);
        }
      } catch (e) {
        // Not JSON, that's ok
      }
    } else if (response.status === 200) {
      console.log(`✅ Success! ${data.substring(0, 100)}...`);
    } else {
      console.log(`⚠️  Unexpected status: ${data}`);
    }

    return response.status;
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return 0;
  }
}

async function testGeneralRateLimit() {
  console.log("\n🧪 TESTING GENERAL RATE LIMIT (3 requests per minute)");
  console.log("=".repeat(60));

  // Make 4 requests quickly to trigger rate limiting
  for (let i = 1; i <= 4; i++) {
    await makeRequest(
      `${BASE_URL}/test-rate-limit`,
      `Request ${i}/4 to test endpoint`
    );

    // Small delay between requests
    if (i < 4) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
}

async function testAuthRateLimit() {
  console.log("\n🔐 TESTING AUTH RATE LIMIT (5 requests per 15 minutes)");
  console.log("=".repeat(60));

  // Make 6 requests to auth endpoint to trigger rate limiting
  for (let i = 1; i <= 6; i++) {
    await makeRequest(`${BASE_URL}/auth/test`, `Auth request ${i}/6`);

    // Small delay between requests
    if (i < 6) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
}

async function runTests() {
  console.log("🚀 Starting Rate Limiting Tests...");
  console.log("Server should be running at http://localhost:4000");

  // Test general rate limiting first
  await testGeneralRateLimit();

  // Wait a moment between tests
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Test auth rate limiting
  await testAuthRateLimit();

  console.log("\n🏁 Rate limiting tests completed!");
  console.log(
    "\nTo reset the rate limits, wait for the time window to expire or restart the server."
  );
}

// Run the tests
runTests().catch(console.error);
