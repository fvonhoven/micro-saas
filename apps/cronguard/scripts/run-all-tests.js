#!/usr/bin/env node

/**
 * Run All Tests
 * 
 * Runs all test scripts for CronNarc
 * 
 * Usage:
 *   node scripts/run-all-tests.js
 */

const { spawn } = require("child_process")
const path = require("path")

const tests = [
  {
    name: "Rate Limiting",
    script: "test-rate-limiting.js",
    description: "Tests rate limiting on auth and API endpoints",
  },
  {
    name: "Email Verification",
    script: "test-email-verification.js",
    description: "Tests email verification requirement for new users",
  },
  {
    name: "Team Collaboration",
    script: "test-teams.js",
    description: "Tests team creation, invites, and permissions",
  },
  {
    name: "Billing & Limits",
    script: "test-billing.js",
    description: "Tests monitor limits, upgrades, downgrades, and payment handling",
  },
]

function runTest(test) {
  return new Promise((resolve, reject) => {
    console.log(`\n${"=".repeat(80)}`)
    console.log(`🧪 Running: ${test.name}`)
    console.log(`📝 ${test.description}`)
    console.log("=".repeat(80))
    console.log("")

    const scriptPath = path.join(__dirname, test.script)
    const child = spawn("node", [scriptPath], {
      stdio: "inherit",
      cwd: process.cwd(),
    })

    child.on("close", (code) => {
      if (code === 0) {
        console.log(`\n✅ ${test.name} - PASSED`)
        resolve()
      } else {
        console.log(`\n❌ ${test.name} - FAILED (exit code ${code})`)
        reject(new Error(`${test.name} failed`))
      }
    })

    child.on("error", (error) => {
      console.error(`\n❌ ${test.name} - ERROR:`, error.message)
      reject(error)
    })
  })
}

async function runAllTests() {
  console.log("🚀 CronNarc Test Suite")
  console.log("=".repeat(80))
  console.log("")
  console.log(`Running ${tests.length} test suites...`)
  console.log("")

  const results = {
    passed: [],
    failed: [],
  }

  for (const test of tests) {
    try {
      await runTest(test)
      results.passed.push(test.name)
    } catch (error) {
      results.failed.push(test.name)
      // Continue running other tests even if one fails
    }
  }

  // Print summary
  console.log("\n\n" + "=".repeat(80))
  console.log("📊 TEST SUMMARY")
  console.log("=".repeat(80))
  console.log("")
  console.log(`Total: ${tests.length}`)
  console.log(`✅ Passed: ${results.passed.length}`)
  console.log(`❌ Failed: ${results.failed.length}`)
  console.log("")

  if (results.passed.length > 0) {
    console.log("✅ Passed tests:")
    results.passed.forEach((name) => console.log(`   - ${name}`))
    console.log("")
  }

  if (results.failed.length > 0) {
    console.log("❌ Failed tests:")
    results.failed.forEach((name) => console.log(`   - ${name}`))
    console.log("")
  }

  console.log("=".repeat(80))

  if (results.failed.length > 0) {
    console.log("\n❌ Some tests failed. Please review the output above.")
    process.exit(1)
  } else {
    console.log("\n🎉 All tests passed!")
    process.exit(0)
  }
}

// Handle errors
process.on("unhandledRejection", (error) => {
  console.error("\n❌ Unhandled error:", error)
  process.exit(1)
})

// Run tests
runAllTests()

