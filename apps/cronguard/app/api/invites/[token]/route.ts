import { adminDb } from "@repo/firebase/admin"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/invites/[token]
 * Get invite details (public endpoint)
 */
export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const { token } = params

    // Find invite by token
    const inviteSnapshot = await adminDb.collection("team_invites").where("token", "==", token).limit(1).get()

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
      // Update status to expired
      await inviteDoc.ref.update({ status: "expired" })
      return NextResponse.json({ error: "Invite has expired" }, { status: 400 })
    }

    // Get team details
    const teamDoc = await adminDb.collection("teams").doc(inviteData.teamId).get()

    if (!teamDoc.exists) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    const teamData = teamDoc.data()

    return NextResponse.json({
      invite: {
        id: inviteDoc.id,
        teamId: inviteData.teamId,
        teamName: teamData?.name || inviteData.teamName,
        email: inviteData.email,
        role: inviteData.role,
        invitedAt: inviteData.invitedAt,
        expiresAt: inviteData.expiresAt,
      },
    })
  } catch (error) {
    console.error("Error fetching invite:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

