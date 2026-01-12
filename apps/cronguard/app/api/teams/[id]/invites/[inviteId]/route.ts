import { adminAuth, adminDb } from "@repo/firebase/admin"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

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

async function getUserTeamRole(userId: string, teamId: string): Promise<string | null> {
  const membershipSnapshot = await adminDb
    .collection("team_members")
    .where("teamId", "==", teamId)
    .where("userId", "==", userId)
    .limit(1)
    .get()

  if (membershipSnapshot.empty) {
    return null
  }

  return membershipSnapshot.docs[0].data().role
}

/**
 * DELETE /api/teams/[id]/invites/[inviteId]
 * Cancel a pending invite
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string; inviteId: string } }) {
  const user = await getUserFromSession(req)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id, inviteId } = params

    // Check if user is admin or owner
    const role = await getUserTeamRole(user.uid, id)
    if (!role || (role !== "owner" && role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get the invite
    const inviteDoc = await adminDb.collection("team_invites").doc(inviteId).get()

    if (!inviteDoc.exists) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 })
    }

    const inviteData = inviteDoc.data()

    // Verify invite belongs to this team
    if (inviteData?.teamId !== id) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 })
    }

    // Update status to cancelled instead of deleting
    await inviteDoc.ref.update({
      status: "cancelled",
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error cancelling invite:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

