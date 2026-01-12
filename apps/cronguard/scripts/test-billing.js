#!/usr/bin/env node

/**
 * Test Billing Features
 * 
 * Tests monitor limits, upgrades, downgrades, and payment handling
 * 
 * Usage:
 *   node scripts/test-billing.js
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

const PLANS = {
  free: { name: "Free", monitors: 2, price: 0 },
  starter: { name: "Starter", monitors: 5, price: 15 },
  pro: { name: "Pro", monitors: 25, price: 39 },
  team: { name: "Team", monitors: 100, price: 99 },
}

async function testMonitorLimits() {
  console.log("📊 Testing Monitor Limits\n")
  console.log("=" .repeat(60))
  console.log("")

  const testUserId = "test-user-" + Date.now()

  console.log("1️⃣  Creating test user (Free plan)...")
  await db.collection("users").doc(testUserId).set({
    email: "test@example.com",
    name: "Test User",
    createdAt: new Date(),
    stripePriceId: null, // Free plan
  })

  console.log("   ✅ User created")

  // Create monitors up to limit
  console.log("\n2️⃣  Creating monitors (Free plan limit: 2)...")
  
  for (let i = 1; i <= 3; i++) {
    await db.collection("monitors").add({
      userId: testUserId,
      name: `Test Monitor ${i}`,
      slug: `test-monitor-${i}-${Date.now()}`,
      interval: 300,
      gracePeriod: 300,
      status: "PENDING",
      createdAt: new Date(),
    })
    console.log(`   ✅ Monitor ${i} created`)
  }

  // Check monitor count
  const monitorsSnapshot = await db
    .collection("monitors")
    .where("userId", "==", testUserId)
    .get()

  console.log(`\n3️⃣  Monitor count: ${monitorsSnapshot.size}`)
  console.log(`   Free plan limit: ${PLANS.free.monitors}`)
  
  if (monitorsSnapshot.size > PLANS.free.monitors) {
    console.log(`   ⚠️  User has ${monitorsSnapshot.size - PLANS.free.monitors} monitors over limit`)
    console.log("   💡 Upgrade modal should be shown in the UI")
  }

  // Cleanup
  console.log("\n4️⃣  Cleaning up...")
  await db.collection("users").doc(testUserId).delete()
  for (const doc of monitorsSnapshot.docs) {
    await doc.ref.delete()
  }
  console.log("   ✅ Test data deleted")

  console.log("\n" + "=".repeat(60))
  console.log("\n✅ Monitor limits test complete!")
}

async function testDowngradeFlow() {
  console.log("\n\n⬇️  Testing Downgrade Flow\n")
  console.log("=" .repeat(60))
  console.log("")

  const testUserId = "test-user-" + Date.now()

  console.log("1️⃣  Creating test user (Pro plan)...")
  await db.collection("users").doc(testUserId).set({
    email: "test@example.com",
    name: "Test User",
    createdAt: new Date(),
    stripePriceId: "price_pro_monthly", // Pro plan
  })

  console.log("   ✅ User created with Pro plan (25 monitors)")

  // Create 10 monitors
  console.log("\n2️⃣  Creating 10 monitors...")
  const monitorIds = []
  
  for (let i = 1; i <= 10; i++) {
    const docRef = await db.collection("monitors").add({
      userId: testUserId,
      name: `Test Monitor ${i}`,
      slug: `test-monitor-${i}-${Date.now()}`,
      interval: 300,
      gracePeriod: 300,
      status: "PENDING",
      createdAt: new Date(),
    })
    monitorIds.push(docRef.id)
    console.log(`   ✅ Monitor ${i} created`)
  }

  // Simulate downgrade to Starter (5 monitors)
  console.log("\n3️⃣  Simulating downgrade to Starter plan (5 monitors)...")
  console.log("   User must select 5 monitors to keep")
  console.log("   Remaining 5 monitors will be archived")

  // Archive 5 monitors
  const toArchive = monitorIds.slice(5)
  for (const id of toArchive) {
    await db.collection("monitors").doc(id).update({
      archivedAt: new Date(),
      archivedReason: "downgrade",
    })
  }

  console.log(`   ✅ Archived ${toArchive.length} monitors`)

  // Check active monitors
  const activeSnapshot = await db
    .collection("monitors")
    .where("userId", "==", testUserId)
    .where("archivedAt", "==", null)
    .get()

  console.log(`\n4️⃣  Active monitors: ${activeSnapshot.size}`)
  console.log(`   Starter plan limit: ${PLANS.starter.monitors}`)

  // Cleanup
  console.log("\n5️⃣  Cleaning up...")
  await db.collection("users").doc(testUserId).delete()
  for (const id of monitorIds) {
    await db.collection("monitors").doc(id).delete()
  }
  console.log("   ✅ Test data deleted")

  console.log("\n" + "=".repeat(60))
  console.log("\n✅ Downgrade flow test complete!")
}

async function testPaymentFailure() {
  console.log("\n\n💳 Testing Payment Failure Handling\n")
  console.log("=" .repeat(60))
  console.log("")

  const testUserId = "test-user-" + Date.now()

  console.log("1️⃣  Creating test user...")
  await db.collection("users").doc(testUserId).set({
    email: "test@example.com",
    name: "Test User",
    createdAt: new Date(),
    stripePriceId: "price_pro_monthly",
    paymentStatus: "active",
  })

  console.log("   ✅ User created with active payment status")

  // Simulate payment failure
  console.log("\n2️⃣  Simulating payment failure...")
  const gracePeriodEndsAt = new Date()
  gracePeriodEndsAt.setDate(gracePeriodEndsAt.getDate() + 7)

  await db.collection("users").doc(testUserId).update({
    paymentStatus: "past_due",
    gracePeriodEndsAt,
    lastPaymentFailedAt: new Date(),
  })

  console.log("   ✅ Payment status set to 'past_due'")
  console.log(`   Grace period ends: ${gracePeriodEndsAt.toISOString()}`)

  // Check user status
  const userDoc = await db.collection("users").doc(testUserId).get()
  const userData = userDoc.data()

  console.log("\n3️⃣  User payment status:")
  console.log(`   Status: ${userData.paymentStatus}`)
  console.log(`   Grace period ends: ${userData.gracePeriodEndsAt.toDate().toISOString()}`)
  console.log("   💡 Payment warning banner should be shown in the UI")

  // Cleanup
  console.log("\n4️⃣  Cleaning up...")
  await db.collection("users").doc(testUserId).delete()
  console.log("   ✅ Test data deleted")

  console.log("\n" + "=".repeat(60))
  console.log("\n✅ Payment failure test complete!")
}

async function runTests() {
  console.log("🧪 CronNarc Billing Tests\n")

  try {
    await testMonitorLimits()
    await testDowngradeFlow()
    await testPaymentFailure()

    console.log("\n✅ All billing tests complete!")
  } catch (error) {
    console.error("\n❌ Tests failed:", error)
    process.exit(1)
  }
}

runTests()

