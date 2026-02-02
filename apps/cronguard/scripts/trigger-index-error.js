#!/usr/bin/env node

/**
 * Trigger Firestore Index Error
 * 
 * This script runs the same query that check-monitors uses,
 * which will trigger the Firestore index error and give you
 * a direct link to create the index.
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

async function triggerIndexError() {
  console.log("🔍 Running query that requires composite index...\n")

  try {
    const now = new Date()

    // This is the exact query from check-monitors.ts that needs the index
    const snapshot = await db
      .collection("monitors")
      .where("status", "in", ["HEALTHY", "LATE", "RUNNING"])
      .where("nextExpectedAt", "<=", now)
      .get()

    console.log("✅ Query succeeded! Index already exists.")
    console.log(`   Found ${snapshot.size} monitors`)
  } catch (error) {
    if (error.message.includes("index")) {
      console.log("🎯 Index error triggered!\n")
      console.log("=" * 80)
      console.log(error.message)
      console.log("=" * 80)
      console.log("\n📋 Look for the URL above that starts with:")
      console.log("   https://console.firebase.google.com/v1/r/project/...")
      console.log("\n👆 Click that link to create the index automatically!")
    } else {
      console.error("❌ Unexpected error:", error.message)
    }
  }
}

triggerIndexError()

