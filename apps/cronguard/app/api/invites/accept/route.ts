import { adminAuth, adminDb } from "@repo/firebase/admin"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { z } from "zod"

const acceptInviteSchema = z.object({
  token: z.string(),
})

async function getUserFromSession(req: NextRequest) {
  const cookieStore = cookies()
  const sessionCookie = cookieStore.get("session")?.value

  if (!sessionCookie) {
    return null
  }

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true)
    return decodedClaims
  } catch {
    return null
  }
}

/**
 * POST /api/invites/accept
 * Accept a team invite
 */
export async function POST(req: NextRequest) {
  const user = await getUserFromSession(req)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = acceptInviteSchema.parse(body)

    // Find invite by token
    const inviteSnapshot = await adminDb.collection("team_invites").where("token", "==", data.token).limit(1).get()

    if (inviteSnapshot.empty) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 })
    }

    const inviteDoc = inviteSnapshot.docs[0]
    const inviteData = inviteDoc.data()

    // Check if invite is still valid
    if (inviteData.status !== "pending") {
      return NextResponse.json({ error: "Invite is no longer valid", status: inviteData.status }, { status: 400 })
    }

    // Check if expired
    const now = new Date()
    const expiresAt = inviteData.expiresAt.toDate()

    if (expiresAt < now) {
      await inviteDoc.ref.update({ status: "expired" })
      return NextResponse.json({ error: "Invite has expired" }, { status: 400 })
    }

    // Verify email matches (if user has email)
    if (user.email && inviteData.email.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json(
        { error: "This invite was sent to a different email address" },
        { status: 403 },
      )
    }

    // Check if user is already a member
    const existingMemberSnapshot = await adminDb
      .collection("team_members")
      .where("teamId", "==", inviteData.teamId)
      .where("userId", "==", user.uid)
      .limit(1)
      .get()

    if (!existingMemberSnapshot.empty) {
      return NextResponse.json({ error: "You are already a member of this team" }, { status: 400 })
    }

    // Add user to team
    await adminDb.collection("team_members").add({
      teamId: inviteData.teamId,
      userId: user.uid,
      role: inviteData.role,
      joinedAt: now,
      invitedBy: inviteData.invitedBy,
    })

    // Update invite status
    await inviteDoc.ref.update({
      status: "accepted",
    })

    // Get team details
    const teamDoc = await adminDb.collection("teams").doc(inviteData.teamId).get()

    return NextResponse.json({
      success: true,
      team: {
        id: teamDoc.id,
        ...teamDoc.data(),
        role: inviteData.role,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error accepting invite:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

