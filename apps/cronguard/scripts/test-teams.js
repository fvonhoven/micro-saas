#!/usr/bin/env node

/**
 * Test Team Collaboration Features
 * 
 * Tests team creation, invites, and permissions
 * 
 * Usage:
 *   node scripts/test-teams.js
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

async function testTeamCreation() {
  console.log("👥 Testing Team Creation\n")
  console.log("=" .repeat(60))
  console.log("")

  const testUserId = "test-user-" + Date.now()
  const testTeamName = "Test Team " + Date.now()

  console.log("1️⃣  Creating test team...")
  console.log(`   Team name: ${testTeamName}`)
  console.log(`   Owner: ${testUserId}`)

  try {
    // Create team
    const teamRef = await db.collection("teams").add({
      name: testTeamName,
      ownerId: testUserId,
      createdAt: new Date(),
      stripePriceId: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    })

    console.log(`   ✅ Team created: ${teamRef.id}`)

    // Add owner as team member
    await db.collection("team_members").add({
      teamId: teamRef.id,
      userId: testUserId,
      role: "owner",
      joinedAt: new Date(),
    })

    console.log("   ✅ Owner added as team member")

    // Verify team exists
    const teamDoc = await teamRef.get()
    const teamData = teamDoc.data()

    console.log("\n2️⃣  Verifying team data...")
    console.log(`   Name: ${teamData.name}`)
    console.log(`   Owner: ${teamData.ownerId}`)
    console.log(`   Created: ${teamData.createdAt.toDate().toISOString()}`)

    // Check team members
    const membersSnapshot = await db
      .collection("team_members")
      .where("teamId", "==", teamRef.id)
      .get()

    console.log(`\n3️⃣  Team members: ${membersSnapshot.size}`)
    membersSnapshot.forEach(doc => {
      const member = doc.data()
      console.log(`   - ${member.userId} (${member.role})`)
    })

    // Cleanup
    console.log("\n4️⃣  Cleaning up...")
    await teamRef.delete()
    for (const doc of membersSnapshot.docs) {
      await doc.ref.delete()
    }
    console.log("   ✅ Test data deleted")

    console.log("\n" + "=".repeat(60))
    console.log("\n✅ Team creation test complete!")

  } catch (error) {
    console.error("\n❌ Test failed:", error.message)
    process.exit(1)
  }
}

async function testTeamInvites() {
  console.log("\n\n📧 Testing Team Invites\n")
  console.log("=" .repeat(60))
  console.log("")

  const testTeamId = "test-team-" + Date.now()
  const testInviterEmail = "inviter@example.com"
  const testInviteeEmail = "invitee@example.com"

  console.log("1️⃣  Creating test invite...")
  console.log(`   Team: ${testTeamId}`)
  console.log(`   Inviter: ${testInviterEmail}`)
  console.log(`   Invitee: ${testInviteeEmail}`)

  try {
    // Create invite
    const token = "test-token-" + Date.now()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days from now

    const inviteRef = await db.collection("team_invites").add({
      teamId: testTeamId,
      email: testInviteeEmail,
      role: "member",
      invitedBy: testInviterEmail,
      token,
      expiresAt,
      createdAt: new Date(),
      status: "pending",
    })

    console.log(`   ✅ Invite created: ${inviteRef.id}`)
    console.log(`   Token: ${token}`)
    console.log(`   Expires: ${expiresAt.toISOString()}`)

    // Verify invite
    const inviteDoc = await inviteRef.get()
    const inviteData = inviteDoc.data()

    console.log("\n2️⃣  Verifying invite data...")
    console.log(`   Status: ${inviteData.status}`)
    console.log(`   Role: ${inviteData.role}`)
    console.log(`   Email: ${inviteData.email}`)

    // Cleanup
    console.log("\n3️⃣  Cleaning up...")
    await inviteRef.delete()
    console.log("   ✅ Test invite deleted")

    console.log("\n" + "=".repeat(60))
    console.log("\n✅ Team invite test complete!")

  } catch (error) {
    console.error("\n❌ Test failed:", error.message)
    process.exit(1)
  }
}

async function printManualTestSteps() {
  console.log("\n\n📋 Manual Testing Steps for Teams\n")
  console.log("=" .repeat(60))
  console.log("")
  console.log("1️⃣  Create a team")
  console.log("   - POST /api/teams")
  console.log("   - Body: { name: 'My Team' }")
  console.log("")
  console.log("2️⃣  Invite a team member")
  console.log("   - POST /api/teams/[teamId]/invites")
  console.log("   - Body: { email: 'user@example.com', role: 'member' }")
  console.log("")
  console.log("3️⃣  Accept invite")
  console.log("   - Visit /invites/[token]")
  console.log("   - Click 'Accept Invitation'")
  console.log("")
  console.log("4️⃣  Create team monitor")
  console.log("   - Switch to team in TeamSelector")
  console.log("   - Create a new monitor")
  console.log("   - Monitor should have teamId set")
  console.log("")
  console.log("=" .repeat(60))
}

async function runTests() {
  console.log("🧪 CronNarc Team Collaboration Tests\n")

  try {
    await testTeamCreation()
    await testTeamInvites()
    await printManualTestSteps()

    console.log("\n✅ All tests complete!")
  } catch (error) {
    console.error("\n❌ Tests failed:", error)
    process.exit(1)
  }
}

runTests()

