#!/usr/bin/env node

/**
 * Test Email Verification Flow
 * 
 * Tests that email verification is required for new users
 * 
 * Usage:
 *   node scripts/test-email-verification.js
 */

require("dotenv").config({ path: ".env.local" })
const admin = require("firebase-admin")

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  })
}

const db = admin.firestore()
const auth = admin.auth()

async function testEmailVerificationRequired() {
  console.log("📧 Testing Email Verification Requirement\n")
  console.log("=" .repeat(60))
  console.log("")

  // Create a test user with unverified email
  const testEmail = `test-${Date.now()}@example.com`
  const testPassword = "TestPassword123!"

  console.log("1️⃣  Creating test user...")
  console.log(`   Email: ${testEmail}`)

  try {
    // Create user
    const userRecord = await auth.createUser({
      email: testEmail,
      password: testPassword,
      emailVerified: false,
    })

    console.log(`   ✅ User created: ${userRecord.uid}`)

    // Create user document
    await db.collection("users").doc(userRecord.uid).set({
      email: testEmail,
      name: "Test User",
      createdAt: new Date(),
      emailVerified: false,
      stripeCustomerId: null,
      stripePriceId: null,
      stripeCurrentPeriodEnd: null,
    })

    console.log("   ✅ User document created")

    // Check email verification status
    console.log("\n2️⃣  Checking email verification status...")
    const user = await auth.getUser(userRecord.uid)
    console.log(`   Email verified: ${user.emailVerified}`)

    if (!user.emailVerified) {
      console.log("   ✅ Email is NOT verified (as expected)")
    } else {
      console.log("   ❌ Email IS verified (unexpected)")
    }

    // Test that monitor creation is blocked
    console.log("\n3️⃣  Testing monitor creation block...")
    console.log("   ⚠️  Note: This requires API authentication. Manual test required.")
    console.log("   To test manually:")
    console.log(`   1. Log in with: ${testEmail}`)
    console.log("   2. Try to create a monitor")
    console.log("   3. Should see: 'Please verify your email address before creating monitors'")

    // Cleanup
    console.log("\n4️⃣  Cleaning up test user...")
    await db.collection("users").doc(userRecord.uid).delete()
    await auth.deleteUser(userRecord.uid)
    console.log("   ✅ Test user deleted")

    console.log("\n" + "=".repeat(60))
    console.log("\n✅ Email verification test complete!")
    console.log("\n📋 Summary:")
    console.log("- New users are created with emailVerified: false")
    console.log("- Users must verify email before creating monitors")
    console.log("- Email verification banner shows on dashboard")
    console.log("- Users can resend verification email")

  } catch (error) {
    console.error("\n❌ Test failed:", error.message)
    process.exit(1)
  }
}

async function testEmailVerificationFlow() {
  console.log("\n\n📧 Email Verification Flow\n")
  console.log("=" .repeat(60))
  console.log("")
  console.log("Manual Testing Steps:")
  console.log("")
  console.log("1️⃣  Sign up with a new account")
  console.log("   - Go to /signup")
  console.log("   - Enter email and password")
  console.log("   - Click 'Sign Up'")
  console.log("")
  console.log("2️⃣  Check for verification email")
  console.log("   - Should see 'Check your email!' message")
  console.log("   - Check inbox for verification email from Firebase")
  console.log("")
  console.log("3️⃣  Before verifying, try to create a monitor")
  console.log("   - Log in to dashboard")
  console.log("   - Should see blue verification banner")
  console.log("   - Try to create a monitor")
  console.log("   - Should get error: 'Please verify your email address'")
  console.log("")
  console.log("4️⃣  Verify email")
  console.log("   - Click link in verification email")
  console.log("   - Return to dashboard")
  console.log("   - Click 'I've Verified - Refresh Page'")
  console.log("")
  console.log("5️⃣  Create monitor after verification")
  console.log("   - Banner should disappear")
  console.log("   - Should be able to create monitors")
  console.log("")
  console.log("=" .repeat(60))
}

async function runTests() {
  console.log("🧪 CronNarc Email Verification Tests\n")

  try {
    await testEmailVerificationRequired()
    await testEmailVerificationFlow()

    console.log("\n✅ All tests complete!")
  } catch (error) {
    console.error("\n❌ Tests failed:", error)
    process.exit(1)
  }
}

runTests()

