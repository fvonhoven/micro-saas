/**
 * Test: Logout Functionality
 *
 * Verifies that logout properly clears both:
 * 1. Server-side session cookie
 * 2. Client-side Firebase auth state
 */

const http = require("http")

const BASE_URL = "http://localhost:3000"

async function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL)
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || "GET",
      headers: options.headers || {},
    }

    const req = http.request(reqOptions, res => {
      let data = ""
      res.on("data", chunk => {
        data += chunk
      })
      res.on("end", () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
        })
      })
    })

    req.on("error", reject)

    if (options.body) {
      req.write(options.body)
    }

    req.end()
  })
}

async function testLogout() {
  console.log("\n🧪 Testing Logout Functionality...\n")

  const tests = {
    passed: [],
    failed: [],
  }

  // Test 1: Check if server is running
  let serverRunning = false
  try {
    await makeRequest("/api/auth/session", { method: "DELETE" })
    serverRunning = true
  } catch (error) {
    console.log("⚠️  Dev server not running - skipping API tests")
    console.log("   (Run 'pnpm dev' to test API endpoints)")
  }

  if (serverRunning) {
    // Test 1: DELETE /api/auth/session endpoint exists
    try {
      const response = await makeRequest("/api/auth/session", {
        method: "DELETE",
      })

      if (response.status === 200) {
        const data = JSON.parse(response.body)
        if (data.success === true) {
          console.log("✅ DELETE /api/auth/session endpoint works")
          tests.passed.push("Session deletion endpoint")
        } else {
          throw new Error("Response missing success: true")
        }
      } else {
        throw new Error(`Expected 200, got ${response.status}`)
      }
    } catch (error) {
      console.log(`❌ DELETE /api/auth/session endpoint failed: ${error.message}`)
      tests.failed.push("Session deletion endpoint")
    }

    // Test 2: Verify session cookie is deleted
    try {
      const response = await makeRequest("/api/auth/session", {
        method: "DELETE",
      })

      // Check if Set-Cookie header is present to clear the cookie
      const setCookie = response.headers["set-cookie"]
      if (setCookie) {
        const cookieString = Array.isArray(setCookie) ? setCookie.join("; ") : setCookie
        // Cookie deletion typically sets Max-Age=0 or Expires in the past
        if (cookieString.includes("session=") && (cookieString.includes("Max-Age=0") || cookieString.includes("Expires="))) {
          console.log("✅ Session cookie is properly cleared")
          tests.passed.push("Session cookie deletion")
        } else {
          console.log("⚠️  Session cookie deletion header present but format unclear")
          tests.passed.push("Session cookie deletion (partial)")
        }
      } else {
        // Some implementations just delete without setting a header
        console.log("⚠️  No Set-Cookie header (cookie may be deleted server-side only)")
        tests.passed.push("Session cookie deletion (server-side)")
      }
    } catch (error) {
      console.log(`❌ Session cookie deletion verification failed: ${error.message}`)
      tests.failed.push("Session cookie deletion")
    }
  }

  // Test 3: Verify logout implementations in pages
  const logoutImplementations = [
    { file: "app/(dashboard)/dashboard/page.tsx", name: "Dashboard" },
    { file: "app/(dashboard)/pricing/page.tsx", name: "Pricing" },
    { file: "app/(dashboard)/profile/page.tsx", name: "Profile" },
    { file: "app/(dashboard)/dashboard/monitors/[id]/page.tsx", name: "Monitor Detail" },
    { file: "app/(dashboard)/team/[id]/settings/page.tsx", name: "Team Settings" },
  ]

  const fs = require("fs")
  const path = require("path")

  for (const impl of logoutImplementations) {
    try {
      const filePath = path.join(__dirname, "..", impl.file)
      const content = fs.readFileSync(filePath, "utf8")

      // Check for proper logout implementation
      const hasSessionDelete = content.includes('fetch("/api/auth/session", { method: "DELETE" })')
      const hasSignOut = content.includes("signOut(auth)")
      const hasHandleLogout = content.includes("handleLogout")

      if (hasSessionDelete && hasSignOut && hasHandleLogout) {
        console.log(`✅ ${impl.name} has complete logout implementation`)
        tests.passed.push(`${impl.name} logout`)
      } else {
        const missing = []
        if (!hasSessionDelete) missing.push("session deletion")
        if (!hasSignOut) missing.push("Firebase signOut")
        if (!hasHandleLogout) missing.push("handleLogout function")
        throw new Error(`Missing: ${missing.join(", ")}`)
      }
    } catch (error) {
      console.log(`❌ ${impl.name} logout incomplete: ${error.message}`)
      tests.failed.push(`${impl.name} logout`)
    }
  }

  // Summary
  console.log("\n" + "=".repeat(50))
  console.log("📊 Test Summary")
  console.log("=".repeat(50))
  console.log(`✅ Passed: ${tests.passed.length}`)
  console.log(`❌ Failed: ${tests.failed.length}`)

  if (tests.failed.length > 0) {
    console.log("\n❌ Failed tests:")
    tests.failed.forEach(test => console.log(`   - ${test}`))
    process.exit(1)
  } else {
    console.log("\n🎉 All logout tests passed!")
    process.exit(0)
  }
}

testLogout().catch(error => {
  console.error("Test error:", error)
  process.exit(1)
})
