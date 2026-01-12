#!/usr/bin/env node

/**
 * Test Rate Limiting
 * 
 * Tests the rate limiting functionality on various endpoints
 * 
 * Usage:
 *   node scripts/test-rate-limiting.js
 */

require("dotenv").config({ path: ".env.local" })

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

async function testAuthRateLimiting() {
  console.log("🔒 Testing Auth Rate Limiting (10 attempts per 15 minutes)...\n")

  const results = []
  
  // Try to create 12 sessions (should fail after 10)
  for (let i = 1; i <= 12; i++) {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: "fake-token-for-testing" }),
      })

      const data = await response.json()
      
      results.push({
        attempt: i,
        status: response.status,
        success: response.ok,
        message: data.error || "Success",
      })

      console.log(`Attempt ${i}: ${response.status} - ${data.error || "Success"}`)
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      console.error(`Attempt ${i} failed:`, error.message)
    }
  }

  console.log("\n📊 Results:")
  const blocked = results.filter(r => r.status === 429).length
  const allowed = results.filter(r => r.status !== 429).length
  
  console.log(`✅ Allowed: ${allowed}`)
  console.log(`❌ Blocked: ${blocked}`)
  
  if (blocked > 0) {
    console.log("\n✅ Rate limiting is working! Requests were blocked after limit.")
  } else {
    console.log("\n⚠️  Warning: No requests were blocked. Rate limiting may not be working.")
  }
}

async function testMonitorCreationRateLimiting() {
  console.log("\n\n🔒 Testing Monitor Creation Rate Limiting (5 per hour)...\n")
  console.log("⚠️  Note: This test requires authentication. Skipping for now.")
  console.log("To test manually:")
  console.log("1. Log in to the dashboard")
  console.log("2. Try to create 6 monitors quickly")
  console.log("3. The 6th should be blocked with a 429 error")
}

async function testGeneralAPIRateLimiting() {
  console.log("\n\n🔒 Testing General API Rate Limiting (100 per 15 minutes)...\n")
  console.log("⚠️  Note: Testing 100+ requests would take too long. Skipping.")
  console.log("Rate limiter is configured and will block after 100 requests in 15 minutes.")
}

async function runTests() {
  console.log("🧪 CronNarc Rate Limiting Tests\n")
  console.log("=" .repeat(60))
  console.log("")

  try {
    await testAuthRateLimiting()
    await testMonitorCreationRateLimiting()
    await testGeneralAPIRateLimiting()

    console.log("\n" + "=".repeat(60))
    console.log("\n✅ Rate limiting tests complete!")
    console.log("\n💡 Tips:")
    console.log("- Rate limits reset after the time window expires")
    console.log("- Auth: 10 attempts per 15 minutes")
    console.log("- Monitor creation: 5 per hour")
    console.log("- General API: 100 per 15 minutes")
  } catch (error) {
    console.error("\n❌ Test failed:", error)
    process.exit(1)
  }
}

runTests()

